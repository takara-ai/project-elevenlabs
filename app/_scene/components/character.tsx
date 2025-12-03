"use client";

import { useEffect, useRef, useMemo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface CharacterProps {
  animationName?: string;
  animationSpeed?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

export function Character({
  animationName = "idle",
  animationSpeed = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  ...props
}: CharacterProps) {
  const group = useRef<THREE.Group>(null);

  // Load the GLB model (contains model + all animations)
  const { scene, animations } = useGLTF("/guy.glb");

  // Extract animation actions
  const { actions } = useAnimations(animations, group);
  const prevAnimationName = useRef<string | undefined>(animationName);
  const prevAnimationSpeed = useRef<number>(animationSpeed);

  // Handle animation switching with fade in/out
  useEffect(() => {
    const action = actions[animationName];

    if (action) {
      // Only reset if the animation name actually changed
      const animationChanged = prevAnimationName.current !== animationName;

      if (animationChanged) {
        prevAnimationName.current = animationName;
        prevAnimationSpeed.current = animationSpeed;

        // Stop all other actions
        Object.values(actions).forEach((a) => {
          if (a && a !== action) {
            a.fadeOut(0.5);
          }
        });

        // Set animation speed before playing
        Object.assign(action, { timeScale: animationSpeed });

        // Play the new animation
        action.reset().fadeIn(0.5).play();

        // Cleanup function
        return () => {
          action.fadeOut(0.5);
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, animationName]);

  // Update animation speed without resetting (preserves current progress)
  useEffect(() => {
    const action = actions[animationName];
    // Only update speed if: action exists, animation name hasn't changed, and speed has changed
    const animationUnchanged = prevAnimationName.current === animationName;
    const speedChanged = prevAnimationSpeed.current !== animationSpeed;

    if (action && animationUnchanged && speedChanged) {
      // Update speed without resetting - this preserves the current animation time/progress
      Object.assign(action, { timeScale: animationSpeed });
      prevAnimationSpeed.current = animationSpeed;
    }
  }, [actions, animationName, animationSpeed]);

  // Convert scale to Vector3 if it's a number
  const scaleVector = useMemo(() => {
    if (typeof scale === "number") {
      return new THREE.Vector3(scale, scale, scale);
    }
    return new THREE.Vector3(...scale);
  }, [scale]);

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      scale={scaleVector}
      {...props}
      dispose={null}
    >
      <primitive object={scene} />
    </group>
  );
}
