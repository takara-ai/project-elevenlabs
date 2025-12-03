"use client";

import { Canvas } from "@react-three/fiber";
import { Scene } from "./_scene/scene";

export default function Home() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <Canvas
        className="h-full w-full"
        gl={{ alpha: false }}
        camera={{ position: [0, 0, 5] }}
      >
        <color attach="background" args={["#000000"]} />
        <Scene />
      </Canvas>
      <div className="absolute top-20 left-0 w-full flex items-center justify-center pointer-events-none">
        <h1 className="text-8xl font-display text-white relative drop-shadow-[0_0_40px_white]">
          Story Line AI
        </h1>
      </div>
    </div>
  );
}
