import { create } from "zustand";

type TriggerUIState = {
  /**
   * Whether a trigger is currently active (player is inside a trigger zone)
   */
  isActive: boolean;
  /**
   * Optional label/prompt to show in the UI
   */
  label: string | null;
  /**
   * Optional identifier for the trigger
   */
  triggerId: string | null;
  /**
   * Set trigger UI state
   */
  setTrigger: (
    isActive: boolean,
    label?: string | null,
    triggerId?: string | null
  ) => void;
  /**
   * Clear trigger UI state
   */
  clearTrigger: () => void;
  /**
   * Trigger the active trigger (called on click)
   */
  trigger: () => void;
  /**
   * Callback to execute when trigger is activated
   */
  onTriggerCallback: (() => void) | null;
  /**
   * Set the callback to execute when trigger is activated
   */
  setOnTriggerCallback: (callback: (() => void) | null) => void;
};

export const useTriggerUIStore = create<TriggerUIState>((set, get) => ({
  isActive: false,
  label: null,
  triggerId: null,
  onTriggerCallback: null,

  setTrigger: (isActive, label = null, triggerId = null) =>
    set({
      isActive,
      label,
      triggerId,
    }),

  clearTrigger: () =>
    set({
      isActive: false,
      label: null,
      triggerId: null,
      onTriggerCallback: null,
    }),

  trigger: () => {
    const { onTriggerCallback, isActive } = get();
    if (isActive && onTriggerCallback) {
      onTriggerCallback();
      // Clear after triggering
      get().clearTrigger();
    }
  },

  setOnTriggerCallback: (callback) =>
    set({
      onTriggerCallback: callback,
    }),
}));
