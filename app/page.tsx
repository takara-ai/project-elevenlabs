"use client";

import { Canvas } from "@react-three/fiber";
import { Scene } from "./_scene/scene";
import { useGameStore } from "./lib/state-management/states";
import { Button } from "@/components/ui/button";
import { game } from "./lib/game/controller";
export default function Home() {
  const state = useGameStore();
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <Canvas className="h-full w-full">
        <color attach="background" args={["#000000"]} />
        <Scene />
      </Canvas>
      <div className="absolute top-20 left-0 w-full flex items-center justify-center pointer-events-none">
        <h1 className="text-8xl font-display text-white relative drop-shadow-[0_0_40px_white]">
          Story Line AI
        </h1>
      </div>
      <div className="absolute bottom-0 left-0 p-4 flex justify-center flex-col">
        <Button
          onClick={() => {
            game.start();
          }}
        >
          start
        </Button>
        <pre className="p-4 bg-black/50 text-white">
          {JSON.stringify(state, null, 2)}
        </pre>
      </div>
    </div>
  );
}
