"use client";

import { useThree } from "@react-three/fiber";
import { useControls } from "leva";
import * as React from "react";
import * as THREE from "three";

export function Camera() {
  const { camera } = useThree();
  const cameraRef = React.useRef(camera);

  const controls = useControls("Camera", {
    position: { value: [0, 5, 4], min: -50, max: 50, step: 0.1 },
    rotation: { value: [-0.95, 0, 0], min: -Math.PI, max: Math.PI, step: 0.01 },
    fov: { value: 41, min: 1, max: 180, step: 1 },
    zoom: { value: 1, min: 0.1, max: 10, step: 0.1 },
    near: { value: 0.1, min: 0.01, max: 10, step: 0.01 },
    far: { value: 1000, min: 100, max: 10000, step: 100 },
  });

  // Update camera properties when controls change
  React.useEffect(() => {
    if (cameraRef.current) {
      const cam = cameraRef.current as THREE.PerspectiveCamera;

      // Update position
      cam.position.set(
        controls.position[0],
        controls.position[1],
        controls.position[2]
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
  }, [controls, camera]);

  // Keep camera ref in sync
  React.useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  return null;
}
