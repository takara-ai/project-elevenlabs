"use client";

import { Text } from "@react-three/drei";
import * as React from "react";

export function Title3D() {
  return (
    <Text
      position={[0, 0.01, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      font="/black-vesper.ttf"
      fontSize={1}
      color="#fff"
      anchorX="center"
      anchorY="middle"
    >
      Story Line AI
    </Text>
  );
}
