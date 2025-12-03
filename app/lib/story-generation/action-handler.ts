'use server'

import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'
import { STARTER_STORIES } from './data'
import { buildNarratorMessages } from './prompts'
import { generateActionSoundEffect } from '../sound-effects/generate'
import { buildActionSoundPrompt } from '../sound-effects/prompts'
import { generateSpeechWithTimestamps, type Alignment } from '../speech/elevenlabs-tts'

const DISABLE_NARRATOR = process.env.DISABLE_NARRATOR === 'true'

const StorySchema = z.object({
  narrativeText: z.string().describe('Narrator describes the scene (2-3 sentences)'),
  actions: z.array(z.string()).length(3).describe('3 bold, dramatic action choices that significantly advance the story - no cautious half-steps'),
})

export interface ActionResult {
  narrativeText: string
  actions: string[]
  audioBase64: string | null
  alignment: Alignment | null
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

  // Generate narrator speech with timestamps AFTER we have the text (must be sequential)
  let audioBase64: string | null = null
  let alignment: Alignment | null = null
  if (!DISABLE_NARRATOR) {
    try {
      const result = await generateSpeechWithTimestamps(object.narrativeText)
      audioBase64 = result.audioBase64
      alignment = result.alignment
    } catch (err) {
      console.error('[Speech] Failed to generate audio:', err)
    }
  }

  return {
    narrativeText: object.narrativeText,
    actions: object.actions,
    audioBase64,
    alignment,
    actionSoundUrl: actionSoundResult.blobUrl || null,
  }
}

