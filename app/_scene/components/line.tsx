import { Line } from "@react-three/drei";
import * as React from "react";
import * as THREE from "three";
export function StraitLine({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  return (
    <Line
      scale={[1, 1, 1]}
      points={[start, end]}
      color="white"
      lineWidth={22}
      renderOrder={2}
    />
  );
}

export function CurverLine({
  start,
  end,
  controlPoints,
  segments = 50,
  curveType = "bezier",

  disabled = false,
}: {
  start: [number, number, number];
  end: [number, number, number];
  controlPoints?: [number, number, number][];
  segments?: number;
  curveType?: "catmullrom" | "bezier";
  disabled?: boolean;
}) {
  const points = React.useMemo(() => {
    if (!controlPoints) {
      return [start, end];
    }
    // Convert all points to THREE.Vector3
    const allPoints = [
      new THREE.Vector3(...start),
      ...controlPoints.map((p) => new THREE.Vector3(...p)),
      new THREE.Vector3(...end),
    ];

    let curve: THREE.Curve<THREE.Vector3>;

    if (curveType === "catmullrom") {
      // CatmullRom creates a smooth curve that passes through all points
      curve = new THREE.CatmullRomCurve3(allPoints);
    } else {
      // For bezier, we need at least 2 control points (start, control1, control2, end)
      // If we have more, we'll use the first and last as control points
      if (controlPoints.length >= 2) {
        curve = new THREE.CubicBezierCurve3(
          allPoints[0], // start
          allPoints[1], // first control point
          allPoints[allPoints.length - 2], // second control point
          allPoints[allPoints.length - 1] // end
        );
      } else if (controlPoints.length === 1) {
        // Quadratic bezier with one control point
        curve = new THREE.QuadraticBezierCurve3(
          allPoints[0], // start
          allPoints[1], // control point
          allPoints[2] // end
        );
      } else {
        // Fallback to straight line if no control points
        return [start, end];
      }
    }

    // Generate points along the curve
    const curvePoints = curve.getPoints(segments);
    return curvePoints.map((p) => [p.x, p.y, p.z] as [number, number, number]);
  }, [start, end, controlPoints, segments, curveType]);

  // Use polygonOffset to push disabled lines back in depth buffer
  const lineRef = React.useCallback(
    (node: THREE.Object3D | null) => {
      if (node && disabled) {
        // Access the material through the drei Line component's internal structure
        // The Line component wraps a mesh, so we need to traverse to find the material
        node.traverse((child: THREE.Object3D) => {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const material = Array.isArray(mesh.material)
              ? mesh.material[0]
              : mesh.material;
            material.polygonOffset = true;
            material.polygonOffsetFactor = 1;
            material.polygonOffsetUnits = 1;
          }
        });
      }
    },
    [disabled]
  );

  if (disabled) {
    return (
      <Line
        ref={lineRef}
        scale={[1, 1, 1]}
        points={points}
        color={"gray"}
        lineWidth={22}
        renderOrder={1}
      />
    );
  } else {
    return (
      <Line
        scale={[1, 1, 1]}
        points={points}
        color={"white"}
        lineWidth={22}
        renderOrder={2}
      />
    );
  }
}
