import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { buildNarratorMessages } from "./prompts";
import {
  generateActionSoundEffect,
  generateMoodMusic,
} from "../sound-effects/generate";
import { buildActionSoundPrompt } from "../sound-effects/prompts";
import { generateSpeechWithTimestamps } from "../speech/elevenlabs-tts";
import {
  HistoryEntry,
  MoodType,
  type Alignment,
} from "../state-management/states";
import type { ActionResult } from "./dto";
import { getCached, setCache } from "../cache/blob-cache";
import { createCacheKey } from "../cache/hash";

const DISABLE_NARRATOR = process.env.DISABLE_NARRATOR === "true";

// Mood types that drive progressive music changes
const MoodEnum = z.enum(["calm", "tense", "danger", "mystery", "triumph"]);

const StorySchema = z.object({
  narrativeText: z
    .string()
    .describe("Narrator describes the scene (2-3 sentences)"),
  actions: z
    .array(z.string())
    .length(2)
    .describe(
      "2 bold, dramatic action choices that significantly advance the story - no cautious half-steps"
    ),
  askAction: z
    .string()
    .describe(
      "A sentence to ask the user to choose an action, e.g. 'What direction do you choose?'"
    ),
  mood: MoodEnum.describe(
    "The current emotional tone: calm (exploration/peaceful), tense (building suspense), danger (combat/threat), mystery (discovery/intrigue), triumph (victory/relief)"
  ),
});

// Type for cached LLM story responses
interface CachedStoryResponse {
  narrativeText: string;
  actions: string[];
  askAction: string;
  mood: MoodType;
}

/**
 * Handle action submission - generates story, action sound, and mood music in parallel
 * Narrator speech runs after story text is generated (needs the text)
 * Mood music only regenerates when the mood changes from the previous state
 * LLM and TTS responses are cached to avoid regeneration
 */
export async function handleAction(
  actionText: string,
  history: HistoryEntry[],
  currentMood: MoodType | null = null,
  currentSetting: string | null = null
): Promise<ActionResult> {
  // Build action sound prompt
  const actionSoundPrompt = buildActionSoundPrompt(actionText);

  // Create cache key from the full message context
  const messages = buildNarratorMessages(history);
  const llmCacheKey = createCacheKey(messages);

  // Check LLM cache first
  const cachedStory = await getCached<CachedStoryResponse>("llm", llmCacheKey);

  // Run Anthropic story generation AND action sound effect in parallel
  // Skip LLM call if we have cached response
  const [storyResult, actionSoundResult] = await Promise.all([
    cachedStory
      ? Promise.resolve({ object: cachedStory, cached: true })
      : generateObject({
          model: anthropic("claude-sonnet-4-5-20250929"),
          schema: StorySchema,
          schemaName: "StoryResponse",
          schemaDescription: "The story continuation with narrative, actions, and mood",
          messages,
        }).then((r) => ({ ...r, cached: false })),
    generateActionSoundEffect(actionSoundPrompt),
  ]);

  const { object, cached: llmCached } = storyResult as {
    object: CachedStoryResponse;
    cached: boolean;
  };

  // Cache LLM response if it was freshly generated
  if (!llmCached) {
    await setCache("llm", llmCacheKey, {
      narrativeText: object.narrativeText,
      actions: object.actions,
      askAction: object.askAction,
      mood: object.mood,
    });
    console.log("[LLM] Cached new story response");
  } else {
    console.log("[LLM] Cache hit for story");
  }
  const newMood = object.mood as MoodType;

  // Generate mood music if mood changed (or first story)
  let moodMusicUrl: string | null = null;
  if (newMood !== currentMood && currentSetting) {
    try {
      const moodResult = await generateMoodMusic(currentSetting, newMood);
      moodMusicUrl = moodResult.blobUrl || null;
    } catch (err) {
      console.error("[MoodMusic] Failed to generate:", err);
    }
  }

  // Generate narrator speech with timestamps AFTER we have the text (must be sequential)
  let audioUrl: string | null = null;
  let alignment: Alignment | null = null;
  if (!DISABLE_NARRATOR) {
    try {
      const result = await generateSpeechWithTimestamps(
        object.narrativeText + " " + object.askAction
      );
      audioUrl = result.audioUrl;
      alignment = result.alignment;
    } catch (err) {
      console.error("[Speech] Failed to generate audio:", err);
    }
  }

  return {
    narrativeText: object.narrativeText,
    actions: object.actions,
    audioUrl,
    alignment,
    actionSoundUrl: actionSoundResult.blobUrl || null,
    mood: newMood,
    moodMusicUrl,
  };
}
