"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useCameraStore } from "../store/camera";
import { useRef, useState, useEffect } from "react";
import { useGameStore } from "@/app/lib/state-management/states";
import { PHASE_HEIGHT, COLUMN_WIDTH } from "./phase";
import { TOP_OFFSET } from "./history";

const AUTOSCROLL_SPEED = 0.005; // Speed of autoscroll (units per frame)
const Z_OFFSET = 3;

export function AutoScrollerTarget({ debug = false }: { debug?: boolean }) {
  const { camera } = useThree();
  const isControlled = useCameraStore((state) => state.isControlled);
  const autoscrollerZ = useCameraStore((state) => state.autoscrollerZ);
  const setAutoscrollerZ = useCameraStore((state) => state.setAutoscrollerZ);
  const addEffect = useCameraStore((state) => state.addEffect);
  const removeEffect = useCameraStore((state) => state.removeEffect);
  const updateEffect = useCameraStore((state) => state.updateEffect);
  const history = useGameStore((state) => state.history);
  const maxZ = useGameStore((state) => {
    return state.history.length * PHASE_HEIGHT + Z_OFFSET;
  });

  // Helper function to calculate X offset for a given phase index
  const calculatePhaseXOffset = (phaseIndex: number): number => {
    let currentColumn = 0;
    history.slice(0, phaseIndex + 1).forEach((entry) => {
      if (entry.type === "action") {
        currentColumn += entry.choiceIndex - 1;
      }
    });
    return currentColumn * COLUMN_WIDTH;
  };

  // Track the autoscroller position (X and Z)
  const currentZ = useRef(autoscrollerZ);
  const currentX = useRef(0);
  const hasInitialized = useRef(false);
  // State for debug visualization (updated in useFrame)
  const [debugPosition, setDebugPosition] = useState<[number, number, number]>([
    0,
    0,
    autoscrollerZ,
  ]);

  // Initialize autoscroller position from camera position on first mount
  useEffect(() => {
    if (!hasInitialized.current && camera) {
      currentZ.current = camera.position.z;
      currentX.current = camera.position.x;
      setAutoscrollerZ(camera.position.z);
      setDebugPosition([camera.position.x, 0, camera.position.z]);
      hasInitialized.current = true;
    }
  }, [camera, setAutoscrollerZ]);

  // Add/remove the autoscroller effect based on isControlled
  useEffect(() => {
    if (!isControlled) {
      // Add effect at index 0 so other effects can stack on top
      addEffect(
        {
          id: "autoscroller",
          targetPosition: [currentX.current, 0, currentZ.current],
          smooth: true,
        },
        { atIndex: 0 }
      );
      return () => {
        removeEffect("autoscroller");
      };
    } else {
      // When controlled, remove the autoscroller effect
      // The autoscroller position stays frozen where it is
      removeEffect("autoscroller");
    }
    return () => {
      //clearup
      removeEffect("autoscroller");
    };
  }, [isControlled, addEffect, removeEffect, camera, setAutoscrollerZ]);

  // Update autoscroller position continuously when not controlled
  useFrame(() => {
    // Only update position when not controlled
    if (currentZ.current < maxZ) {
      currentZ.current += AUTOSCROLL_SPEED;
    } else {
      currentZ.current = maxZ;
    }

    // Calculate which phase index we're at based on Z position
    const phaseIndex = Math.floor(
      (currentZ.current - TOP_OFFSET) / PHASE_HEIGHT
    );
    // Clamp phase index to valid range
    const clampedPhaseIndex = Math.max(
      0,
      Math.min(phaseIndex, history.length - 1)
    );
    // Update X position to match the current phase's X offset
    currentX.current = calculatePhaseXOffset(clampedPhaseIndex);

    setAutoscrollerZ(currentZ.current);

    // Update debug visualization
    if (debug) {
      setDebugPosition([currentX.current, 0, currentZ.current]);
    }

    if (!isControlled) {
      // Update the effect with new position
      updateEffect("autoscroller", {
        targetPosition: [currentX.current, 0, currentZ.current],
      });
    }
  });

  // Sync debug state when autoscrollerZ changes (only when not controlled)
  useEffect(() => {
    if (debug && !isControlled) {
      setDebugPosition([currentX.current, 0, autoscrollerZ]);
    }
  }, [autoscrollerZ, debug, isControlled]);

  // Debug visualization
  if (debug) {
    return (
      <mesh position={debugPosition}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="red" transparent opacity={0.8} />
      </mesh>
    );
  }
  return null;
}
