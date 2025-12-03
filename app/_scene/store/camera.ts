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
}

type CameraState = {
  /**
   * Active camera effects (stacked, last one takes priority)
   */
  activeEffects: CameraEffect[];
  /**
   * Add a camera effect
   */
  addEffect: (effect: CameraEffect) => void;
  /**
   * Remove a camera effect by id
   */
  removeEffect: (id: string) => void;
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
  
  addEffect: (effect) =>
    set((state) => ({
      activeEffects: [...state.activeEffects, effect],
    })),
  
  removeEffect: (id) =>
    set((state) => ({
      activeEffects: state.activeEffects.filter((e) => e.id !== id),
    })),
  
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

