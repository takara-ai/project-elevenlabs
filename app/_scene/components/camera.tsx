"use client";

import { useThree, useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import * as React from "react";
import * as THREE from "three";
import { useMotionValue, useSpring } from "motion/react";

export function Camera() {
  const { camera, gl } = useThree();
  const cameraRef = React.useRef(camera);

  const controls = useControls("Camera", {
    position: { value: [0, 5, 4], min: -50, max: 50, step: 0.1 },
    rotation: { value: [-0.95, 0, 0], min: -Math.PI, max: Math.PI, step: 0.01 },
    fov: { value: 41, min: 1, max: 180, step: 1 },
    zoom: { value: 1, min: 0.1, max: 10, step: 0.1 },
    near: { value: 0.1, min: 0.01, max: 10, step: 0.01 },
    far: { value: 1000, min: 100, max: 10000, step: 100 },
    scrollSpeed: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
    springStiffness: { value: 100, min: 0, max: 500, step: 1 },
    springDamping: { value: 30, min: 0, max: 100, step: 1 },
    springMass: { value: 1, min: 0.1, max: 10, step: 0.1 },
  });

  // Motion value for target z position
  const targetZ = useMotionValue(controls.position[2]);
  const smoothZ = useSpring(targetZ, {
    stiffness: controls.springStiffness,
    damping: controls.springDamping,
    mass: controls.springMass,
  });

  // Initialize targetZ only once on mount
  const hasInitialized = React.useRef(false);
  React.useEffect(() => {
    if (!hasInitialized.current) {
      targetZ.set(controls.position[2]);
      hasInitialized.current = true;
    }
  }, [targetZ, controls.position]);

  // Handle scroll wheel
  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * controls.scrollSpeed * 0.01;
      const currentZ = targetZ.get();
      targetZ.set(currentZ + delta);
    };

    const canvas = gl.domElement;
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [gl.domElement, targetZ, controls.scrollSpeed]);

  // Update camera z position with smooth motion
  useFrame(() => {
    if (cameraRef.current) {
      const cam = cameraRef.current as THREE.PerspectiveCamera;
      cam.position.z = smoothZ.get();
    }
  });

  // Update camera properties when controls change
  React.useEffect(() => {
    if (cameraRef.current) {
      const cam = cameraRef.current as THREE.PerspectiveCamera;

      // Update position (x and y from controls, z from smooth scroll)
      cam.position.set(
        controls.position[0],
        controls.position[1],
        smoothZ.get()
      );

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

      // Update zoom
      cam.zoom = controls.zoom;
      cam.updateProjectionMatrix();

      // Update near and far planes
      cam.near = controls.near;
      cam.far = controls.far;
      cam.updateProjectionMatrix();
    }
  }, [controls, camera, smoothZ]);

  // Keep camera ref in sync
  React.useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  return null;
}
