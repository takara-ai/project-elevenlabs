"use server";

import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { buildNarratorMessages } from "./prompts";
import { generateActionSoundEffect } from "../sound-effects/generate";
import { buildActionSoundPrompt } from "../sound-effects/prompts";

const StorySchema = z.object({
  narrativeText: z
    .string()
    .describe("Narrator describes the scene (2-3 sentences)"),
  actions: z
    .array(z.string())
    .length(3)
    .describe(
      "3 bold, dramatic action choices that significantly advance the story - no cautious half-steps"
    ),
});

export interface ActionResult {
  narrativeText: string;
  actions: string[];
  actionSoundUrl: string | null;
}

/**
 * Handle action submission - generates story and action sound effect in parallel
 * TTS is handled client-side via streaming for lower latency
 */
export async function handleAction(
  setting: string,
  actionText: string,
  history: { text: string; type: "story" | "action" }[],
  cycleIndex: number
): Promise<ActionResult> {
  const actionSoundPrompt = buildActionSoundPrompt(actionText);

  const [storyResult, actionSoundResult] = await Promise.all([
    generateObject({
      model: anthropic("claude-3-5-haiku-latest"),
      schema: StorySchema,
      messages: buildNarratorMessages(setting, history, cycleIndex === 0),
    }),
    generateActionSoundEffect(actionSoundPrompt),
  ]);

  return {
    narrativeText: storyResult.object.narrativeText,
    actions: storyResult.object.actions,
    actionSoundUrl: actionSoundResult.blobUrl || null,
  };
}
