"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useCameraStore } from "../store/camera";
import { useRef, useState, useEffect } from "react";
import { useGameStore } from "@/app/lib/state-management/states";
import { PHASE_HEIGHT } from "./phase";

const AUTOSCROLL_SPEED = 0.005; // Speed of autoscroll (units per frame)
const Z_OFFSET = 3;

export function AutoScrollerTarget({ debug = true }: { debug?: boolean }) {
  const { camera } = useThree();
  const isControlled = useCameraStore((state) => state.isControlled);
  const autoscrollerZ = useCameraStore((state) => state.autoscrollerZ);
  const setAutoscrollerZ = useCameraStore((state) => state.setAutoscrollerZ);
  const addEffect = useCameraStore((state) => state.addEffect);
  const removeEffect = useCameraStore((state) => state.removeEffect);
  const updateEffect = useCameraStore((state) => state.updateEffect);
  const maxZ = useGameStore((state) => {
    return state.history.length * PHASE_HEIGHT + Z_OFFSET;
  });

  // Track the autoscroller position (X and Z)
  const currentZ = useRef(autoscrollerZ);
  const currentX = useRef(0); // Will be used in the future
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
        0
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
    if (!isControlled) {
      // Only update position when not controlled
      if (currentZ.current < maxZ) {
        currentZ.current += AUTOSCROLL_SPEED;
      } else {
        currentZ.current = maxZ;
      }
      // currentX.current will be updated in the future for X movement
      setAutoscrollerZ(currentZ.current);

      // Update debug visualization
      if (debug) {
        setDebugPosition([currentX.current, 0, currentZ.current]);
      }

      // Update the effect with new position
      updateEffect("autoscroller", {
        targetPosition: [currentX.current, 0, currentZ.current],
      });
    }
    // When controlled, autoscroller position stays frozen - don't update anything
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
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="red" transparent opacity={0.8} />
      </mesh>
    );
  }
  return null;
}
