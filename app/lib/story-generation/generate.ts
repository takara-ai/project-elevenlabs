"use server";

import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { buildNarratorMessages } from "./prompts";
import {
  generateSpeechWithTimestamps,
  type Alignment,
} from "../speech/elevenlabs-tts";

const DISABLE_NARRATOR = process.env.DISABLE_NARRATOR === "true";

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

export interface GeneratedStory {
  narrativeText: string;
  actions: string[];
  audioBase64: string | null;
  alignment: Alignment | null;
}

export async function generateStoryScenario(
  setting: string,
  history: { text: string; type: "story" | "action" }[],
  cycleIndex: number
): Promise<GeneratedStory> {
  // Generate story text
  const { object } = await generateObject({
    model: anthropic("claude-3-5-haiku-latest"),
    schema: StorySchema,
    messages: buildNarratorMessages(setting, history, cycleIndex === 0),
  });

  // Generate narration audio with timestamps (skip if disabled for dev cost savings)
  let audioBase64: string | null = null;
  let alignment: Alignment | null = null;
  if (!DISABLE_NARRATOR) {
    try {
      const result = await generateSpeechWithTimestamps(object.narrativeText);
      audioBase64 = result.audioBase64;
      alignment = result.alignment;
    } catch (err) {
      console.error("[Speech] Failed to generate audio:", err);
    }
  }

  return {
    narrativeText: object.narrativeText,
    actions: object.actions,
    audioBase64,
    alignment,
  };
}
