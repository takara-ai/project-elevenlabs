import { useMemo } from "react";
import { useControls } from "leva";
import { add } from "@/app/lib/math";

function generateRandomSpheres(
  count: number,
  spreadDistance: number,
  floored: boolean
) {
  // Only generate ONCE, so the positions/colors remain stable across renders.
  const arr: {
    key: number;
    position: [number, number, number];
    color: string;
  }[] = [];
  for (let i = 0; i < count; i++) {
    // Random position within spherical shell radius 2-4
    const r = 2 + Math.random() * 2; // 2 to 4
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta) * spreadDistance;
    const y = floored
      ? 0
      : Math.abs(r * Math.sin(phi) * Math.sin(theta)) * spreadDistance;
    const z = r * Math.cos(phi) * spreadDistance;
    arr.push({
      key: i,
      position: [x, y, z],
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
    });
  }
  return arr;
}

export function RandomSpheres({
  count = 20,
  offset = [0, 0, 0],
  // Remove spreadDistance from props, so remove it here too
  floored = false,
}: {
  count?: number;
  offset?: [number, number, number];
  // spreadDistance?: number;
  floored?: boolean;
}) {
  const { sphereRadius, sphereSegments, spreadDistance } = useControls(
    "Random Spheres",
    {
      sphereRadius: { value: 0.05, min: 0.01, max: 2, step: 0.01 },
      sphereSegments: { value: 24, min: 4, max: 64, step: 1 },
      spreadDistance: { value: 2, min: 0.1, max: 10, step: 0.01 },
    }
  );

  // Stable random spheres using useMemo, so random is only called on first mount.
  const spheres = useMemo(
    () => generateRandomSpheres(count, spreadDistance, floored),
    [count, spreadDistance, floored]
  );

  return (
    <>
      {spheres.map(({ key, position, color }) => (
        <mesh
          key={key}
          position={add(offset, position as [number, number, number])}
        >
          <sphereGeometry
            args={[sphereRadius, sphereSegments, sphereSegments]}
          />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}
