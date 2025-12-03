'use server'

import { anthropic } from '@ai-sdk/anthropic'
import { elevenlabs } from '@ai-sdk/elevenlabs'
import { generateObject, experimental_generateSpeech as generateSpeech } from 'ai'
import { z } from 'zod'
import { STARTER_STORIES } from './data'
import { buildNarratorMessages } from './prompts'
import { generateActionSoundEffect } from '../sound-effects/generate'
import { buildActionSoundPrompt } from '../sound-effects/prompts'

const DISABLE_NARRATOR = process.env.DISABLE_NARRATOR === 'true'

const StorySchema = z.object({
  narrativeText: z.string().describe('Narrator describes the scene (2-3 sentences)'),
  actions: z.array(z.string()).length(3).describe('3 bold, dramatic action choices that significantly advance the story - no cautious half-steps'),
})

export interface ActionResult {
  narrativeText: string
  actions: string[]
  audioBase64: string | null
  actionSoundUrl: string | null
}

/**
 * Handle action submission - generates story and action sound effect in parallel
 * Narrator speech runs after story text is generated (needs the text)
 */
export async function handleAction(
  starterStoryId: string,
  actionText: string,
  history: { text: string; type: 'story' | 'action' }[],
  cycleIndex: number,
  customSetting?: string
): Promise<ActionResult> {
  let setting: string

  if (starterStoryId === 'custom') {
    if (!customSetting) throw new Error('Custom setting required')
    setting = customSetting
  } else {
    const starter = STARTER_STORIES.find(s => s.id === starterStoryId)
    if (!starter) throw new Error('Unknown starter story')
    setting = starter.setting
  }

  // Build action sound prompt
  const actionSoundPrompt = buildActionSoundPrompt(actionText)

  // Run Anthropic story generation AND action sound effect in parallel
  const [storyResult, actionSoundResult] = await Promise.all([
    generateObject({
      model: anthropic('claude-3-5-haiku-latest'),
      schema: StorySchema,
      messages: buildNarratorMessages(setting, history, cycleIndex === 0),
    }),
    generateActionSoundEffect(actionSoundPrompt),
  ])

  const { object } = storyResult

  // Generate narrator speech AFTER we have the text (must be sequential)
  let audioBase64: string | null = null
  if (!DISABLE_NARRATOR) {
    try {
      const speech = await generateSpeech({
        model: elevenlabs.speech('eleven_v3'),
        text: object.narrativeText,
        voice: 'AeRdCCKzvd23BpJoofzx',
      })
      
      const buffer = Buffer.from(speech.audio.uint8Array)
      audioBase64 = buffer.toString('base64')
    } catch (err) {
      console.error('[Speech] Failed to generate audio:', err)
    }
  }

  return {
    narrativeText: object.narrativeText,
    actions: object.actions,
    audioBase64,
    actionSoundUrl: actionSoundResult.blobUrl || null,
  }
}

