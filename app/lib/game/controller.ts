/**
 * Game Controller API
 *
 * Usage:
 *   import { game, useGameStore } from '@/app/lib/game'
 *
 *   // UI bindings
 *   const { setStarter, setCustomSetting, setCustomActionInput } = useGameStore()
 *
 *   // Start game (uses pending values from store)
 *   await game.start()
 *
 *   // After reading story
 *   game.ready()
 *
 *   // Submit action
 *   await game.act('Enter the corridor')
 *   await game.actCustom() // uses customActionInput from store
 *
 *   // Reset
 *   game.reset()
 */

import {
  useGameStore,
  GamePhase,
  type StoryEntry,
  type ActionEntry,
} from "../state-management/states";
import { generateStoryScenario } from "../story-generation/generate";

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

async function generate() {
  const store = useGameStore.getState();
  const { starterStoryId, customSetting, cycleIndex } = store;

  if (!starterStoryId) throw new Error("No story configured");

  log("generate", { cycleIndex, starterStoryId });
  store._setGenerating(true);
  store._setLoading(30);

  try {
    const history = getHistoryContext();
    store._setLoading(60);

    const { narrativeText, actions, audioBase64 } = await generateStoryScenario(
      starterStoryId,
      history,
      cycleIndex,
      customSetting ?? undefined
    );

    log("generated", {
      narrativeText: narrativeText.slice(0, 50) + "...",
      actions,
      hasAudio: !!audioBase64,
    });
    store._setStory(narrativeText, actions, audioBase64);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    log("error", message);
    store._setError(message);
    throw err;
  } finally {
    store._setGenerating(false);
  }
}

export const game = {
  /**
   * Start game using pendingStarter and pendingCustomSetting from store
   */
  async start() {
    const { pendingStarter, pendingCustomSetting } = useGameStore.getState();
    if (!pendingStarter) throw new Error("No starter selected");

    log("start", { storyId: pendingStarter });
    const store = useGameStore.getState();
    store._reset();
    store._setConfig(
      pendingStarter,
      pendingStarter === "custom" ? pendingCustomSetting : undefined
    );
    // Restore pending values after reset
    store.setStarter(pendingStarter);
    store.setCustomSetting(pendingCustomSetting);
    await generate();
  },

  /**
   * Mark story as read, enable action selection
   */
  ready() {
    log("ready");
    useGameStore.getState()._setPhase(GamePhase.ACTION);
  },

  /**
   * Submit a preset action
   */
  async act(text: string) {
    log("act", { text });
    useGameStore.getState()._addAction(text, false);
    await generate();
  },

  /**
   * Submit custom action using customActionInput from store
   */
  async actCustom() {
    const { customActionInput } = useGameStore.getState();
    if (!customActionInput.trim()) throw new Error("No custom action entered");

    log("actCustom", { text: customActionInput });
    useGameStore.getState()._addAction(customActionInput.trim(), true);
    await generate();
  },

  /**
   * Reset game to initial state
   */
  reset() {
    log("reset");
    useGameStore.getState()._reset();
  },

  /** Get current state snapshot */
  getState: useGameStore.getState,

  /** Subscribe to state changes */
  subscribe: useGameStore.subscribe,
};
