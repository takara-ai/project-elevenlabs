"use client";

import { Canvas } from "@react-three/fiber";
import { Scene } from "./_scene/scene";
import { useGameStore } from "./lib/state-management/states";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { game } from "./lib/game/controller";

export default function Home() {
  const state = useGameStore();
  useEffect(() => {
    game.start();
  }, []);
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
      <pre className="absolute bottom-0 left-0 p-4 bg-black/50 text-white">
        <Button
          onClick={() => {
            game.start();
          }}
        >
          start
        </Button>
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}
