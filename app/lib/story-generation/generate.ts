'use server'

import { anthropic } from '@ai-sdk/anthropic'
import { elevenlabs } from '@ai-sdk/elevenlabs'
import { generateObject, experimental_generateSpeech as generateSpeech } from 'ai'
import { z } from 'zod'
import { STARTER_STORIES } from './data'
import { buildNarratorMessages } from './prompts'

const StorySchema = z.object({
  narrativeText: z.string().describe('Narrator describes the scene (2-3 sentences)'),
  actions: z.array(z.string()).length(3).describe('3 action choices'),
})

export interface GeneratedStory {
  narrativeText: string
  actions: string[]
  audioBase64: string | null
}

export async function generateStoryScenario(
  starterStoryId: string,
  history: { text: string; type: 'story' | 'action' }[],
  cycleIndex: number,
  customSetting?: string
): Promise<GeneratedStory> {
  let setting: string

  if (starterStoryId === 'custom') {
    if (!customSetting) throw new Error('Custom setting required')
    setting = customSetting
  } else {
    const starter = STARTER_STORIES.find(s => s.id === starterStoryId)
    if (!starter) throw new Error('Unknown starter story')
    setting = starter.setting
  }

  // Generate story text
  const { object } = await generateObject({
    model: anthropic('claude-3-5-haiku-latest'),
    schema: StorySchema,
    messages: buildNarratorMessages(setting, history, cycleIndex === 0),
  })

  // Generate narration audio
  let audioBase64: string | null = null
  try {
    const speech = await generateSpeech({
      model: elevenlabs.speech('eleven_v3'),
      text: object.narrativeText,
      voice: 'AeRdCCKzvd23BpJoofzx',
    })
    
    // speech.audio is a GeneratedAudioFile with uint8Array property
    const buffer = Buffer.from(speech.audio.uint8Array)
    audioBase64 = buffer.toString('base64')
  } catch (err) {
    console.error('[Speech] Failed to generate audio:', err)
  }

  return {
    narrativeText: object.narrativeText,
    actions: object.actions,
    audioBase64,
  }
}
