import { Line } from "@react-three/drei";
import * as React from "react";

export function Line000to0010() {
  return (
    <Line
      points={[
        [0, 0, 0],
        [0, 0, 10],
      ]}
      color="white"
      lineWidth={22}
    />
  );
}
