"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { useMotionValue, useSpring } from "motion/react";
import { useControls } from "leva";
import { useCursorStore } from "../store/cursor";

export function CursorPosition() {
  const { camera, raycaster, gl } = useThree();
  const setWorldPosition = useCursorStore((state) => state.setWorldPosition);
  const [hitPoint, setHitPoint] = React.useState<THREE.Vector3 | null>(null);
  const mouse = React.useRef(new THREE.Vector2());

  const {
    threshold,
    springStiffness,
    springDamping,
    springMass,
    indicatorRadius,
    indicatorSegments,
    indicatorEmissiveIntensity,
    show,
  } = useControls("Cursor", {
    threshold: { value: 0.25, min: 0, max: 1, step: 0.01 },
    springStiffness: { value: 100, min: 0, max: 500, step: 1 },
    springDamping: { value: 30, min: 0, max: 100, step: 1 },
    springMass: { value: 1, min: 0.1, max: 10, step: 0.1 },
    indicatorRadius: { value: 0.1, min: 0.01, max: 1, step: 0.01 },
    indicatorSegments: { value: 16, min: 4, max: 32, step: 1 },
    indicatorEmissiveIntensity: { value: 0.5, min: 0, max: 2, step: 0.1 },
    show: { value: false },
  });

  // Create motion values for raw cursor position
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawZ = useMotionValue(0);

  // Create smoothed motion values using spring animation
  const smoothX = useSpring(rawX, {
    stiffness: springStiffness,
    damping: springDamping,
    mass: springMass,
  });
  const smoothY = useSpring(rawY, {
    stiffness: springStiffness,
    damping: springDamping,
    mass: springMass,
  });
  const smoothZ = useSpring(rawZ, {
    stiffness: springStiffness,
    damping: springDamping,
    mass: springMass,
  });

  // Create a plane at y=0 (the floor level)
  const floorPlane = React.useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    []
  );

  // Track mouse position
  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    gl.domElement.addEventListener("mousemove", handleMouseMove);
    return () =>
      gl.domElement.removeEventListener("mousemove", handleMouseMove);
  }, [gl.domElement]);

  useFrame(() => {
    // Update raycaster
    raycaster.setFromCamera(mouse.current, camera);

    // Get the ray from the raycaster
    const ray = raycaster.ray;

    // Intersect the ray with the floor plane (y=0)
    const intersectionPoint = new THREE.Vector3();
    ray.intersectPlane(floorPlane, intersectionPoint);

    // Read smoothed values
    const smoothedX = smoothX.get();
    const smoothedY = smoothY.get();
    const smoothedZ = smoothZ.get();

    // Only update raw values if the intersection point is far enough from smoothed values
    if (intersectionPoint) {
      const dx = intersectionPoint.x - smoothedX;
      const dy = intersectionPoint.y - smoothedY;
      const dz = intersectionPoint.z - smoothedZ;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance > threshold) {
        // Update raw motion values (these will be smoothed by the springs)
        rawX.set(intersectionPoint.x);
        rawY.set(intersectionPoint.y);
        rawZ.set(intersectionPoint.z);
      }
    }

    setWorldPosition(smoothedX, smoothedY, smoothedZ);
    setHitPoint(new THREE.Vector3(smoothedX, smoothedY, smoothedZ));
  });

  // Render a small ball at the hit position
  if (!hitPoint) return null;

  if (!show) return null;
  return (
    <mesh position={[hitPoint.x, hitPoint.y, hitPoint.z]}>
      <sphereGeometry
        args={[indicatorRadius, indicatorSegments, indicatorSegments]}
      />
      <meshStandardMaterial
        color="#ff6b6b"
        emissive="red"
        emissiveIntensity={indicatorEmissiveIntensity}
      />
    </mesh>
  );
}
