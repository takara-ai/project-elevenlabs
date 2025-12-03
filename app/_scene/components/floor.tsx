import { useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import { useControls } from "leva";
import { Mesh } from "three";

/**
 * Floor component that always follows the camera, so the floor is always "here".
 */
export function Floor() {
  const { camera } = useThree();
  const meshRef = React.useRef<Mesh>(null);

  const { floorY, floorSize } = useControls("Floor", {
    floorY: { value: -0.01, min: -1, max: 1, step: 0.01 },
    floorSize: { value: 50, min: 1, max: 200, step: 1 },
  });

  useFrame(() => {
    if (!meshRef.current) return;
    // Always attach the floor mesh to the camera's position (at y = 0)
    const cam = camera;
    meshRef.current.position.x = cam.position.x;
    meshRef.current.position.z = cam.position.z;
    // Keep the floor at a fixed 'y' (e.g., y = 0) just below camera
    meshRef.current.position.y = floorY;

    // Optionally: Align the floor to the camera's rotation, but usually flat
    meshRef.current.rotation.x = -Math.PI / 2;
  });

  return (
    <mesh ref={meshRef} receiveShadow>
      <planeGeometry args={[floorSize, floorSize]} />
      <meshStandardMaterial color="#504040" roughness={0.8} metalness={0.1} />
    </mesh>
  );
}
