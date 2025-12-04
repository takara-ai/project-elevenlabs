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

function getSettingFromHistory(): string | null {
  const { history } = useGameStore.getState();
  const initialStory = history.find((h) => h.type === "story") as StoryEntry | undefined;
  return initialStory?.narrativeText || null;
}

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

async function startGame(setting: string) {
  log("startGame", { setting: setting.slice(0, 50) + "..." });
  const store = useGameStore.getState();
  store._reset();
  store._setConfig();

  if (setting) {
    loadSoundstage(setting).catch((err) => log("soundstage error", err));
  }
}

export const game = {
  /**
   * Submit an action. Returns narrativeText for client-side TTS streaming.
   */
  async act(options: { text: string; choiceIndex: number }): Promise<{ narrativeText: string } | void> {
    const { text, choiceIndex } = options;
    log("act", { text, choiceIndex });

    const store = useGameStore.getState();
    const { cycleIndex, history } = store;
    const hasStarted = history.some((h) => h.type === "action");

    if (!hasStarted) {
      const initialStory = history.find((h) => h.type === "story") as StoryEntry | undefined;
      if (!initialStory) throw new Error("No initial story entry found");

      const setting = initialStory.narrativeText || "";
      await startGame(setting);

      const updatedStore = useGameStore.getState();
      updatedStore._addAction(text, choiceIndex, false);
      updatedStore._setGenerating(true);
      updatedStore._setActionSound(null, true);
      updatedStore._setLoading(30);

      try {
        const history = getHistoryContext();
        updatedStore._setLoading(60);

        const { narrativeText, actions, actionSoundUrl } = await handleAction(
          setting, text, history, updatedStore.cycleIndex
        );

        log("generated", { narrativeText: narrativeText.slice(0, 50) + "...", actions });

        useGameStore.getState()._setActionSound(actionSoundUrl, false);
        useGameStore.getState()._setStory(narrativeText, actions, true);
        
        return { narrativeText };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        log("error", message);
        useGameStore.getState()._setError(message);
        throw err;
      } finally {
        useGameStore.getState()._setGenerating(false);
      }
    }

    const setting = getSettingFromHistory();
    if (!setting) throw new Error("No story configured");

    store._addAction(text, choiceIndex, false);
    store._setGenerating(true);
    store._setActionSound(null, true);
    store._setLoading(30);

    try {
      const history = getHistoryContext();
      store._setLoading(60);

      const { narrativeText, actions, actionSoundUrl } = await handleAction(
        setting, text, history, cycleIndex
      );

      log("generated", { narrativeText: narrativeText.slice(0, 50) + "...", actions });

      useGameStore.getState()._setActionSound(actionSoundUrl, false);
      useGameStore.getState()._setStory(narrativeText, actions, true);
      
      return { narrativeText };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      log("error", message);
      useGameStore.getState()._setError(message);
      throw err;
    } finally {
      useGameStore.getState()._setGenerating(false);
    }
  },

  reset() {
    log("reset");
    useGameStore.getState()._reset();
  },
};
