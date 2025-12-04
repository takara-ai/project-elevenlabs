import { Line } from "@react-three/drei";
import * as React from "react";
import * as THREE from "three";

const LINE_WIDTH = 0.11;
const Y_SCALE = 1;

export function StraitLine({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  // Compute 4 evenly spaced middle points between start and end
  const points: [number, number, number][] = React.useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const pointsArray = [startVec];
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      const mid = new THREE.Vector3().lerpVectors(startVec, endVec, t);
      pointsArray.push(mid);
    }
    pointsArray.push(endVec);
    return pointsArray.map((p) => [p.x, p.y, p.z]);
  }, [start, end]);

  return (
    <Line
      scale={[1, Y_SCALE, 1]}
      points={points}
      color="white"
      worldUnits
      lineWidth={LINE_WIDTH}
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
  if (disabled) {
    return (
      <Line
        scale={[1, Y_SCALE / 2, 1]}
        points={points}
        worldUnits
        color={"#222020"}
        lineWidth={LINE_WIDTH}
        renderOrder={1}
      />
    );
  } else {
    return (
      <Line
        scale={[1, Y_SCALE, 1]}
        points={points}
        worldUnits
        color={"white"}
        lineWidth={LINE_WIDTH}
        renderOrder={2}
      />
    );
  }
}
