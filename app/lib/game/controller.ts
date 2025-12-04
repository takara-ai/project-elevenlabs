/**
 * Game Controller API
 *
 * Usage:
 *   import { game, useGameStore } from '@/app/lib/game'
 *
 *   // Submit action (handles both starting and regular actions)
 *   await game.act({ text: 'Enter the corridor', choiceIndex: 0 })
 *
 *   // Reset
 *   game.reset()
 */

import {
  useGameStore,
  type StoryEntry,
  type ActionEntry,
  type MoodType,
} from "../state-management/states";
import { handleAction } from "../story-generation/action-handler";
import { generateSoundEffect } from "../sound-effects/generate";
import { buildSoundstagePrompt } from "../sound-effects/prompts";

const log = (action: string, data?: unknown) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Game] ${action}`, data ?? "");
  }
};

const getHistoryContext = () => {
  const { history } = useGameStore.getState();
  return history.map((h) => ({
    text:
      h.type === "story"
        ? (h as StoryEntry).narrativeText
        : (h as ActionEntry).text,
    type: h.type,
  }));
};

/**
 * Extract setting from the initial history entry (first story entry)
 */
function getSettingFromHistory(): string | null {
  const { history } = useGameStore.getState();

  // Find the first story entry (initial entry)
  const initialStory = history.find((h) => h.type === "story") as
    | StoryEntry
    | undefined;

  if (!initialStory) return null;

  // Use the narrativeText as the setting
  return initialStory.narrativeText || null;
}

/**
 * Generate soundstage audio for the story setting
 */
async function loadSoundstage(setting: string): Promise<void> {
  const store = useGameStore.getState();
  store._setSoundstage(null, true);

  try {
    const prompt = buildSoundstagePrompt(setting);
    const result = await generateSoundEffect(prompt);

    log("soundstage", { url: result.blobUrl, cached: result.cached });
    useGameStore.getState()._setSoundstage(result.blobUrl);
  } catch (err) {
    log("soundstage error", err);
    useGameStore.getState()._setSoundstage(null, false);
  }
}

/**
 * Internal function to initialize the game
 * This only sets up the config - does not generate a story
 */
async function startGame(setting: string) {
  log("startGame", { setting: setting.slice(0, 50) + "..." });
  const store = useGameStore.getState();
  store._reset();
  store._setConfig();

  // Load soundstage in background (don't wait for it)
  if (setting) {
    loadSoundstage(setting).catch((err) => {
      log("soundstage error", err);
    });
  }
}

export const game = {
  /**
   * Submit an action. If the game hasn't started yet, this will initialize it.
   * @param options.text - The action text to submit
   * @param options.choiceIndex - The index of the choice (used for initial story selection)
   */
  async act(options: { text: string; choiceIndex: number }) {
    const { text, choiceIndex } = options;
    log("act", { text, choiceIndex });

    const store = useGameStore.getState();
    const { history, currentMood } = store;

    // Get setting from history for mood music generation
    const setting = getSettingFromHistory();

    // Regular action flow - get setting from history
    store._addAction(text, choiceIndex, false);
    store._setGenerating(true);
    store._setActionSound(null, true);
    store._setLoading(30);

    try {
      store._setLoading(60);

      // Single server action that runs Anthropic + sound effect + mood music in parallel
      const { narrativeText, actions, audioBase64, alignment, actionSoundUrl, mood, moodMusicUrl } =
        await handleAction(text, history, currentMood, setting);

      log("generated", {
        narrativeText: narrativeText.slice(0, 50) + "...",
        actions,
        hasAudio: !!audioBase64,
        hasAlignment: !!alignment,
        hasActionSound: !!actionSoundUrl,
        mood,
        hasMoodMusic: !!moodMusicUrl,
      });

      // Set everything and transition to STORY
      useGameStore.getState()._setActionSound(actionSoundUrl, false);
      
      // Update mood music if it changed
      if (moodMusicUrl) {
        useGameStore.getState()._setMoodMusic(moodMusicUrl, mood, false);
      } else if (mood !== currentMood) {
        // Mood changed but no new music URL - just update the mood
        useGameStore.getState()._setMoodMusic(null, mood, false);
      }
      
      useGameStore
        .getState()
        ._setStory(narrativeText, actions, audioBase64, alignment, true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      log("error", message);
      useGameStore.getState()._setError(message);
      throw err;
    } finally {
      useGameStore.getState()._setGenerating(false);
    }
  },

  /**
   * Reset game to initial state
   */
  reset() {
    log("reset");
    useGameStore.getState()._reset();
  },
};
