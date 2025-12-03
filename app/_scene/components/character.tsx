"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";
import { useCursorStore } from "../store/cursor";

interface CharacterProps {
  animationName?: string;
  animationSpeed?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  // If true, character will move to cursor position automatically
  followCursor?: boolean;
}

export function Character({
  animationName: propAnimationName,
  animationSpeed: propAnimationSpeed,
  position: initialPosition = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  followCursor = true,
  ...props
}: CharacterProps) {
  const group = useRef<THREE.Group>(null);
  const currentPosition = useRef(new THREE.Vector3(...initialPosition));
  const previousPosition = useRef(new THREE.Vector3(...initialPosition));
  const currentRotation = useRef(new THREE.Euler(...rotation));

  // Get cursor position from store (already smoothed by cursor-position component)
  const cursorX = useCursorStore((state) => state.worldX);
  const cursorZ = useCursorStore((state) => state.worldZ);

  const { idleSpeedThreshold, maxAnimationSpeed, animationFadeDuration } =
    useControls("Character Movement", {
      idleSpeedThreshold: { value: 0.3, min: 0.01, max: 0.5, step: 0.01 },
      maxAnimationSpeed: { value: 3, min: 0.5, max: 5, step: 0.1 },
      animationFadeDuration: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
    });

  // Internal animation state
  const [internalAnimationName, setInternalAnimationName] = useState("idle");
  const [internalAnimationSpeed, setInternalAnimationSpeed] = useState(1);

  // Use internal state if followCursor is true, otherwise use props
  const animationName = followCursor
    ? internalAnimationName
    : propAnimationName || "idle";
  const animationSpeed = followCursor
    ? internalAnimationSpeed
    : propAnimationSpeed || 1;

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
            a.fadeOut(animationFadeDuration);
          }
        });

        // Set animation speed before playing
        Object.assign(action, { timeScale: animationSpeed });

        // Play the new animation
        action.reset().fadeIn(animationFadeDuration).play();

        // Cleanup function
        return () => {
          action.fadeOut(animationFadeDuration);
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, animationName]);

  // Update animation speed without resetting (preserves current progress)
  // This handles speed changes when followCursor is false (using prop speed)
  useEffect(() => {
    const action = actions[animationName];
    // Only update speed if: action exists, animation name hasn't changed, and speed has changed
    const animationUnchanged = prevAnimationName.current === animationName;
    const speedChanged = prevAnimationSpeed.current !== animationSpeed;

    if (action && animationUnchanged && speedChanged && !followCursor) {
      // When not following cursor, update speed directly
      Object.assign(action, { timeScale: animationSpeed });
      prevAnimationSpeed.current = animationSpeed;
    }
  }, [actions, animationName, animationSpeed, followCursor]);

  // Initialize position on mount
  useEffect(() => {
    currentPosition.current.set(...initialPosition);
    previousPosition.current.set(...initialPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Convert scale to Vector3 if it's a number
  const scaleVector = useMemo(() => {
    if (typeof scale === "number") {
      return new THREE.Vector3(scale, scale, scale);
    }
    return new THREE.Vector3(...scale);
  }, [scale]);

  // Simplified movement system - character follows cursor position directly
  useFrame((state, delta) => {
    if (!followCursor || !group.current) return;

    // Store previous position for velocity calculation
    previousPosition.current.copy(currentPosition.current);

    // Set position directly to cursor position (already smoothed by cursor-position component)
    currentPosition.current.set(cursorX, 0, cursorZ);
    group.current.position.copy(currentPosition.current);

    // Calculate velocity (movement per second)
    const velocity = new THREE.Vector3()
      .subVectors(currentPosition.current, previousPosition.current)
      .divideScalar(delta);

    // Calculate speed (magnitude of velocity)
    const speed = velocity.length();

    // Calculate direction for rotation
    if (speed > 0.001) {
      // Normalize velocity to get direction
      const direction = velocity.clone().normalize();
      const angle = Math.atan2(direction.x, direction.z);
      currentRotation.current.y = angle;
      group.current.rotation.y = angle;
    }

    // Determine animation state and speed based on movement speed
    let targetSpeed: number;
    let targetAnimation: string;

    if (speed > idleSpeedThreshold) {
      // Moving - use running animation
      targetAnimation = "running";
      // Map speed to animation speed (normalize to reasonable range)
      // Speed is in units per second, normalize to animation speed multiplier
      targetSpeed = Math.min(speed / 2, maxAnimationSpeed);
    } else {
      // Idle - use idle animation
      targetAnimation = "idle";
      targetSpeed = 1;
    }

    // Update animation state
    if (internalAnimationName !== targetAnimation) {
      setInternalAnimationName(targetAnimation);
    }
    if (internalAnimationSpeed !== targetSpeed) {
      setInternalAnimationSpeed(targetSpeed);
    }

    // Update animation speed directly
    const action = actions[animationName];
    if (action && prevAnimationName.current === animationName) {
      Object.assign(action, { timeScale: targetSpeed });
    }
  });

  return (
    <group
      ref={group}
      position={currentPosition.current}
      rotation={followCursor ? currentRotation.current : rotation}
      scale={scaleVector}
      {...props}
      dispose={null}
    >
      <primitive object={scene} />
    </group>
  );
}
