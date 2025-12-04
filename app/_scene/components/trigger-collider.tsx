"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useCursorStore } from "../store/cursor";
import { useTriggerUIStore } from "../store/trigger-ui";
import { Line } from "@react-three/drei";
import { useSearchParams } from "next/navigation";

export interface TriggerColliderProps {
  /**
   * Position of the trigger box center
   */
  position: [number, number, number];
  /**
   * Size of the trigger box [width, height, depth]
   */
  size: [number, number, number];
  /**
   * Callback when player enters the trigger
   */
  onEnter?: () => void;
  /**
   * Callback when player exits the trigger
   */
  onExit?: () => void;
  /**
   * Callback called every frame while player is inside
   */
  onInside?: () => void;
  /**
   * Callback triggered when player clicks while inside the trigger
   */
  onTrigger?: () => void;
  /**
   * Optional identifier for this trigger
   */
  id?: string;
  /**
   * Optional label to show in the trigger UI
   */
  label?: string;
}

/**
 * Box trigger collider that detects when the player (cursor position) enters/exits
 * a box region and calls appropriate callbacks.
 */
export function TriggerCollider({
  position,
  size,
  onEnter,
  onExit,
  onInside,
  onTrigger,
  label,
  id,
}: TriggerColliderProps) {
  const params = useSearchParams();
  const debug = !!params.get("debug");
  const boxRef = useRef<THREE.Box3 | null>(null);
  const [isInside, setIsInside] = useState(false);
  const { setTrigger, clearTrigger, setOnTriggerCallback } =
    useTriggerUIStore();

  // Initialize bounding box
  useEffect(() => {
    const [width, height, depth] = size;
    const [x, y, z] = position;

    const min = new THREE.Vector3(x - width / 2, y - height / 2, z - depth / 2);
    const max = new THREE.Vector3(x + width / 2, y + height / 2, z + depth / 2);

    boxRef.current = new THREE.Box3(min, max);
  }, [position, size]);

  useFrame((state, delta) => {
    if (!boxRef.current) return;

    // Get player position from cursor store
    const cursorX = useCursorStore.getState().worldX;
    const cursorY = useCursorStore.getState().worldY;
    const cursorZ = useCursorStore.getState().worldZ;

    const playerPos = new THREE.Vector3(cursorX, cursorY, cursorZ);
    const isCurrentlyInside = boxRef.current.containsPoint(playerPos);

    // Detect enter/exit transitions
    if (isCurrentlyInside && !isInside) {
      // Just entered
      setIsInside(true);
      // Set trigger UI state if onTrigger callback exists
      if (onTrigger && label) {
        setOnTriggerCallback(onTrigger);
        setTrigger(true, label, id);
      }
      onEnter?.();
    } else if (!isCurrentlyInside && isInside) {
      // Just exited
      setIsInside(false);
      // Clear trigger UI state
      if (onTrigger) {
        clearTrigger();
      }
      onExit?.();
    }

    // Call onInside if player is inside
    if (isCurrentlyInside) {
      onInside?.();
    }
  });

  // Debug visualization
  if (!debug) return null;

  // Create 12 wireframe edges for a box using <Line> from @react-three/drei
  // Using same logic as previously but with <Line />
  const [width, height, depth] = size;
  const [cx, cy, cz] = position;

  // 8 box corners
  const corners = [
    [cx - width / 2, cy - height / 2, cz - depth / 2],
    [cx + width / 2, cy - height / 2, cz - depth / 2],
    [cx + width / 2, cy + height / 2, cz - depth / 2],
    [cx - width / 2, cy + height / 2, cz - depth / 2],
    [cx - width / 2, cy - height / 2, cz + depth / 2],
    [cx + width / 2, cy - height / 2, cz + depth / 2],
    [cx + width / 2, cy + height / 2, cz + depth / 2],
    [cx - width / 2, cy + height / 2, cz + depth / 2],
  ];
  // Edge definitions ([startIdx, endIdx])
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0], // bottom
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4], // top
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7], // sides
  ];

  // Use same style as StraitLine from line.tsx
  const LINE_WIDTH = 3;

  return (
    <>
      {edges.map(([startIdx, endIdx], i) => (
        <Line
          key={i}
          points={[
            new THREE.Vector3(...corners[startIdx]),
            new THREE.Vector3(...corners[endIdx]),
          ]}
          color={isInside ? "green" : "gray"}
          lineWidth={LINE_WIDTH}
        />
      ))}
    </>
  );
}
