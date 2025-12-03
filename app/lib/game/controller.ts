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
    const { cycleIndex, history } = store;

    // Check if game has started by looking for any action in history
    const hasStarted = history.some((h) => h.type === "action");

    // If game hasn't started, initialize it using the initial history entry
    if (!hasStarted) {
      // Get the setting from the initial story entry
      const initialStory = history.find((h) => h.type === "story") as
        | StoryEntry
        | undefined;

      if (!initialStory) {
        throw new Error("No initial story entry found in history");
      }

      const setting = initialStory.narrativeText || "";

      // Initialize game (this resets state)
      await startGame(setting);

      // Now add the action and process it
      const updatedStore = useGameStore.getState();
      updatedStore._addAction(text, choiceIndex, false);
      updatedStore._setGenerating(true);
      updatedStore._setActionSound(null, true);
      updatedStore._setLoading(30);

      try {
        const history = getHistoryContext();
        updatedStore._setLoading(60);

        const {
          narrativeText,
          actions,
          audioBase64,
          alignment,
          actionSoundUrl,
        } = await handleAction(setting, text, history, updatedStore.cycleIndex);

        log("generated", {
          narrativeText: narrativeText.slice(0, 50) + "...",
          actions,
          hasAudio: !!audioBase64,
          hasAlignment: !!alignment,
          hasActionSound: !!actionSoundUrl,
        });

        useGameStore.getState()._setActionSound(actionSoundUrl, false);
        useGameStore
          .getState()
          ._setStory(narrativeText, actions, audioBase64, alignment, true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Generation failed";
        log("error", message);
        useGameStore.getState()._setError(message);
        throw err;
      } finally {
        useGameStore.getState()._setGenerating(false);
      }
      return;
    }

    // Regular action flow - get setting from history
    const setting = getSettingFromHistory();
    if (!setting) throw new Error("No story configured");

    store._addAction(text, choiceIndex, false);
    store._setGenerating(true);
    store._setActionSound(null, true);
    store._setLoading(30);

    try {
      const history = getHistoryContext();
      store._setLoading(60);

      // Single server action that runs Anthropic + sound effect in parallel
      const { narrativeText, actions, audioBase64, alignment, actionSoundUrl } =
        await handleAction(setting, text, history, cycleIndex);

      log("generated", {
        narrativeText: narrativeText.slice(0, 50) + "...",
        actions,
        hasAudio: !!audioBase64,
        hasAlignment: !!alignment,
        hasActionSound: !!actionSoundUrl,
      });

      // Set everything and transition to STORY
      useGameStore.getState()._setActionSound(actionSoundUrl, false);
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
