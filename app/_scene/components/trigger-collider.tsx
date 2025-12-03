"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useCursorStore } from "../store/cursor";
import { Line, Html } from "@react-three/drei";

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
   * Callback triggered after staying inside for triggerDuration seconds
   */
  onTrigger?: () => void;
  /**
   * Duration in seconds to stay inside before triggering onTrigger
   */
  triggerDuration?: number;
  /**
   * Optional identifier for this trigger
   */
  id?: string;
  /**
   * Whether to show debug visualization
   */
  debug?: boolean;
  /**
   * Whether to show progress bar when trigger is active
   */
  showProgress?: boolean;
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
  triggerDuration = 2,
  debug = true,
  showProgress = false,
}: TriggerColliderProps) {
  const isInsideRef = useRef(false);
  const boxRef = useRef<THREE.Box3 | null>(null);
  const timeInsideRef = useRef(0);
  const hasTriggeredRef = useRef(false);
  const [isInside, setIsInside] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

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
    if (isCurrentlyInside && !isInsideRef.current) {
      // Just entered
      isInsideRef.current = true;
      setIsInside(true);
      timeInsideRef.current = 0;
      hasTriggeredRef.current = false;
      setHasTriggered(false);
      onEnter?.();
    } else if (!isCurrentlyInside && isInsideRef.current) {
      // Just exited
      isInsideRef.current = false;
      setIsInside(false);
      timeInsideRef.current = 0;

      hasTriggeredRef.current = false;
      setHasTriggered(false);

      onExit?.();
    }

    // Update timer and trigger if duration reached
    if (isCurrentlyInside && onTrigger && !hasTriggeredRef.current) {
      timeInsideRef.current += delta;
      if (timeInsideRef.current >= triggerDuration) {
        hasTriggeredRef.current = true;
        setHasTriggered(true);
        onTrigger();
      }
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
          color="green"
          lineWidth={LINE_WIDTH}
        />
      ))}
      {showProgress && onTrigger && isInside && !hasTriggered && (
        <Html
          position={[cx, cy + height / 2 + 0.5, cz]}
          className="w-20 z-1000"
          transform={false}
          center
        >
          <div className="w-full relative bg-zinc-700 rounded-sm h-4 overflow-hidden">
            <div
              className="absolute top-0 left-0 bg-green-500 h-full"
              style={{
                width: "100%",
                animation: `fill-progress-bar ${
                  triggerDuration || 1
                }s linear forwards`,
              }}
            />
          </div>
        </Html>
      )}
    </>
  );
}
