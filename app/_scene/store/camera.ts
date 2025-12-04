import { create } from "zustand";
import { useEffect } from "react";

export interface CameraEffect {
  /**
   * Target zoom level (1 = normal, <1 = zoomed in, >1 = zoomed out)
   */
  zoom?: number;
  /**
   * Target position to focus on [x, y, z]
   */
  targetPosition?: [number, number, number];
  /**
   * Whether to smoothly transition
   */
  smooth?: boolean;
  /**
   * Unique identifier for this effect
   */
  id: string;
  /**
   * If true, this effect will always be placed at the top (highest priority)
   * and will override all other effects
   */
  topPriority?: boolean;
}

type CameraState = {
  /**
   * Active camera effects (stacked, last one takes priority)
   */
  activeEffects: CameraEffect[];
  /**
   * Default X position to return to when all effects are removed
   */
  defaultXPosition: number;
  /**
   * Whether the camera is controlled by user (false = autoscroll mode)
   */
  isControlled: boolean;
  /**
   * Current autoscroller Z position (tracks where autoscroll would be)
   */
  autoscrollerZ: number;
  /**
   * Add a camera effect
   */
  addEffect: (
    effect: CameraEffect,
    options?: { atIndex?: number; topPriority?: boolean }
  ) => void;
  /**
   * Remove a camera effect by id
   */
  removeEffect: (id: string) => void;
  /**
   * Update an existing camera effect by id
   */
  updateEffect: (
    id: string,
    updates: Partial<Omit<CameraEffect, "id">>
  ) => void;
  /**
   * Set the default X position for when all effects are removed
   */
  setDefaultXPosition: (x: number) => void;
  /**
   * Set whether the camera is controlled by user
   */
  setIsControlled: (controlled: boolean) => void;
  /**
   * Update the autoscroller Z position
   */
  setAutoscrollerZ: (z: number) => void;
  /**
   * Get the current effective zoom (from the top effect)
   */
  getCurrentZoom: () => number | undefined;
  /**
   * Get the current target position (from the top effect)
   */
  getCurrentTargetPosition: () => [number, number, number] | undefined;
};

export const useCameraStore = create<CameraState>((set, get) => ({
  activeEffects: [],
  defaultXPosition: 0,
  isControlled: false,
  autoscrollerZ: 0,

  addEffect: (effect, options) => {
    const { atIndex, topPriority } = options || {};
    const effectWithPriority = { ...effect, topPriority: topPriority ?? effect.topPriority };

    set((state) => {
      let newEffects = [...state.activeEffects];

      // Remove existing effect with same id if it exists
      newEffects = newEffects.filter((e) => e.id !== effect.id);

      if (atIndex !== undefined) {
        newEffects.splice(atIndex, 0, effectWithPriority);
      } else if (topPriority ?? effect.topPriority) {
        // Add at the end (highest priority)
        newEffects.push(effectWithPriority);
      } else {
        // Add at the end, but before any topPriority effects
        const topPriorityIndex = newEffects.findIndex((e) => e.topPriority);
        if (topPriorityIndex === -1) {
          newEffects.push(effectWithPriority);
        } else {
          newEffects.splice(topPriorityIndex, 0, effectWithPriority);
        }
      }

      return { activeEffects: newEffects };
    });
  },

  removeEffect: (id) =>
    set((state) => ({
      activeEffects: state.activeEffects.filter((e) => e.id !== id),
    })),

  updateEffect: (id, updates) =>
    set((state) => ({
      activeEffects: state.activeEffects.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),

  setDefaultXPosition: (x) => set({ defaultXPosition: x }),

  setIsControlled: (controlled) => set({ isControlled: controlled }),

  setAutoscrollerZ: (z) => set({ autoscrollerZ: z }),

  getCurrentZoom: () => {
    const effects = get().activeEffects;
    return effects.length > 0 ? effects[effects.length - 1].zoom : undefined;
  },

  getCurrentTargetPosition: () => {
    const effects = get().activeEffects;
    return effects.length > 0
      ? effects[effects.length - 1].targetPosition
      : undefined;
  },
}));

/**
 * Hook to easily add/remove camera zoom effect
 */
export function useCameraZoom(
  zoom: number | undefined,
  id: string,
  enabled: boolean = true
) {
  const addEffect = useCameraStore((state) => state.addEffect);
  const removeEffect = useCameraStore((state) => state.removeEffect);

  useEffect(() => {
    if (enabled && zoom !== undefined) {
      addEffect({ id, zoom, smooth: true });
      return () => removeEffect(id);
    }
  }, [zoom, enabled, id, addEffect, removeEffect]);
}

/**
 * Hook to easily add/remove camera zoom on position effect
 */
export function useCameraZoomOnPosition(
  position: [number, number, number] | undefined,
  zoom: number | undefined,
  id: string,
  enabled: boolean = true
) {
  const addEffect = useCameraStore((state) => state.addEffect);
  const removeEffect = useCameraStore((state) => state.removeEffect);

  useEffect(() => {
    if (enabled && position && zoom !== undefined) {
      addEffect({ id, zoom, targetPosition: position, smooth: true });
      return () => removeEffect(id);
    }
  }, [position, zoom, enabled, id, addEffect, removeEffect]);
}
