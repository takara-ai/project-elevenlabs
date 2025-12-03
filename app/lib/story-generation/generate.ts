'use server'

import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'
import { STARTER_STORIES } from './data'
import { buildNarratorMessages } from './prompts'

const StorySchema = z.object({
  narrativeText: z.string().describe('Narrator describes the scene (2-3 sentences)'),
  actions: z.array(z.string()).length(3).describe('3 action choices'),
})

export type GeneratedStory = z.infer<typeof StorySchema>

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

  const { object } = await generateObject({
    model: anthropic('claude-3-5-haiku-latest'),
    schema: StorySchema,
    messages: buildNarratorMessages(setting, history, cycleIndex === 0),
  })

  return object
}
