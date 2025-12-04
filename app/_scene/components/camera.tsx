"use client";

import { useThree, useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";
import { useMotionValue, useSpring } from "motion/react";
import { useCameraStore } from "../store/camera";
import { useRef, useEffect } from "react";

export function Camera() {
  const { camera, gl } = useThree();
  const cameraRef = useRef(camera);
  // Subscribe to active effects to trigger re-renders when they change
  const activeEffects = useCameraStore((state) => state.activeEffects);
  const defaultXPosition = useCameraStore((state) => state.defaultXPosition);
  const isControlled = useCameraStore((state) => state.isControlled);
  const setIsControlled = useCameraStore((state) => state.setIsControlled);
  const autoscrollerZ = useCameraStore((state) => state.autoscrollerZ);
  const setAutoscrollerZ = useCameraStore((state) => state.setAutoscrollerZ);

  const setDefaultXPosition = useCameraStore(
    (state) => state.setDefaultXPosition
  );

  const controls = useControls("Camera", {
    position: { value: [0, 5, -3], min: -50, max: 50, step: 0.1 },
    rotation: { value: [-0.95, 0, 0], min: -Math.PI, max: Math.PI, step: 0.01 },
    fov: { value: 41, min: 1, max: 180, step: 1 },
    zoom: { value: 1, min: 0.1, max: 10, step: 0.1 },
    near: { value: 0.1, min: 0.01, max: 10, step: 0.01 },
    far: { value: 1000, min: 100, max: 10000, step: 100 },
    scrollSpeed: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
    springStiffness: { value: 100, min: 0, max: 500, step: 1 },
    springDamping: { value: 30, min: 0, max: 100, step: 1 },
    springMass: { value: 1, min: 0.1, max: 10, step: 0.1 },
    defaultXPosition: {
      value: defaultXPosition,
      min: -50,
      max: 50,
      step: 0.1,
      onChange: (value) => setDefaultXPosition(value),
    },
  });

  // Motion value for target z position
  const targetZ = useMotionValue(controls.position[2]);
  const smoothZ = useSpring(targetZ, {
    stiffness: controls.springStiffness,
    damping: controls.springDamping,
    mass: controls.springMass,
  });

  // Motion value for target x position (for centering on targets)
  const targetX = useMotionValue(controls.position[0]);
  const smoothX = useSpring(targetX, {
    stiffness: controls.springStiffness / 2,
    damping: controls.springDamping * 2,
    mass: controls.springMass,
  });

  // Motion value for smooth zoom
  const targetZoom = useMotionValue(controls.zoom);
  const smoothZoom = useSpring(targetZoom, {
    stiffness: controls.springStiffness,
    damping: controls.springDamping,
    mass: controls.springMass,
  });

  // Initialize targetZ and targetX only once on mount
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      targetZ.set(controls.position[2]);
      targetX.set(defaultXPosition);
      targetZoom.set(controls.zoom);
      hasInitialized.current = true;
    }
  }, [
    targetZ,
    targetX,
    targetZoom,
    controls.position,
    controls.zoom,
    defaultXPosition,
  ]);

  // Update zoom and position based on camera store effects
  useEffect(() => {
    // Get the top priority effect (last in array, or last topPriority effect)
    const topPriorityEffects = activeEffects.filter((e) => e.topPriority);
    const topEffect =
      topPriorityEffects.length > 0
        ? topPriorityEffects[topPriorityEffects.length - 1]
        : activeEffects.length > 0
        ? activeEffects[activeEffects.length - 1]
        : null;

    // Get autoscroller effect (should be at index 0)
    const autoscrollerEffect = activeEffects.find(
      (e) => e.id === "autoscroller"
    );

    // Update zoom
    const effectZoom = topEffect?.zoom;
    const targetZoomValue =
      effectZoom !== undefined ? effectZoom : controls.zoom;
    targetZoom.set(targetZoomValue);

    // Update X position to center on target
    const effectTargetPosition = topEffect?.targetPosition;
    if (effectTargetPosition) {
      // Center camera X on the target position
      targetX.set(effectTargetPosition[0]);
    } else {
      // Return to default X position from store (when all effects are removed)
      targetX.set(defaultXPosition);
    }

    // Update Z position based on isControlled state
    if (!isControlled && autoscrollerEffect?.targetPosition) {
      // When not controlled, use autoscroller target Z
      targetZ.set(autoscrollerEffect.targetPosition[2]);
    } else if (isControlled) {
      // When controlled, keep current Z (user controls it via scroll)
      // Don't update targetZ here, let scroll handler control it
      // Sync autoscroller Z to current camera Z so it can catch up when switching back
      const currentZ = smoothZ.get();
      if (currentZ > autoscrollerZ) {
        setAutoscrollerZ(currentZ);
      }
    }
  }, [
    activeEffects,
    controls.zoom,
    controls.position,
    targetZoom,
    targetX,
    targetZ,
    defaultXPosition,
    isControlled,
    smoothZ,
    setAutoscrollerZ,
    autoscrollerZ,
  ]);

  // Handle scroll wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.deltaY > 0 && !isControlled) {
        return;
      }
      // When user starts scrolling, set to controlled mode
      if (!isControlled) {
        setIsControlled(true);
      }

      const delta = e.deltaY * controls.scrollSpeed * 0.01;

      const currentZ = targetZ.get();
      const newZ = currentZ + delta;

      targetZ.set(newZ);
      // If scrolled below autoscroller Z, switch back to autoscroll
      if (isControlled && newZ > autoscrollerZ) {
        setIsControlled(false);
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [
    gl.domElement,
    targetZ,
    controls.scrollSpeed,
    isControlled,
    setIsControlled,
    autoscrollerZ,
  ]);

  // Handle spacebar zoom
  useEffect(() => {
    const addEffect = useCameraStore.getState().addEffect;
    const removeEffect = useCameraStore.getState().removeEffect;
    const SPACEBAR_ZOOM_ID = "spacebar-zoom";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        addEffect(
          { id: SPACEBAR_ZOOM_ID, zoom: 0.3, smooth: true },
          { topPriority: true }
        );
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        removeEffect(SPACEBAR_ZOOM_ID);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      // Clean up effect on unmount
      removeEffect(SPACEBAR_ZOOM_ID);
    };
  }, []);

  // Update camera position and zoom with smooth motion
  useFrame(() => {
    if (cameraRef.current) {
      const cam = cameraRef.current as THREE.PerspectiveCamera;
      cam.position.x = smoothX.get();
      cam.position.z = smoothZ.get();
      cam.zoom = smoothZoom.get();
      cam.updateProjectionMatrix();

      // Check if camera Z is below autoscroller Z when controlled
      if (isControlled && smoothZ.get() > autoscrollerZ) {
        setIsControlled(false);
      }
    }
  });

  // Update camera properties when controls change
  useEffect(() => {
    if (cameraRef.current) {
      const cam = cameraRef.current as THREE.PerspectiveCamera;

      // Update position (x from smooth targeting, y from controls, z from smooth scroll)
      cam.position.set(smoothX.get(), controls.position[1], smoothZ.get());

      // Update rotation
      cam.rotation.set(
        controls.rotation[0],
        controls.rotation[1],
        controls.rotation[2]
      );

      // Update FOV
      if (cam.fov !== controls.fov) {
        cam.fov = controls.fov;
        cam.updateProjectionMatrix();
      }

      // Update near and far planes
      cam.near = controls.near;
      cam.far = controls.far;
      cam.updateProjectionMatrix();
    }
  }, [controls, camera, smoothZ, smoothX]);

  // Keep camera ref in sync
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  return null;
}
