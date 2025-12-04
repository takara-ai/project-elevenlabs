"use client";

import { Canvas } from "@react-three/fiber";
import { Scene } from "../_scene/scene";
import { useGameStore } from "../lib/state-management/states";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { game } from "../lib/game/controller";
import { SplashContainer, Title, Prompt } from "../../components/splash";

export default function Home() {
  const state = useGameStore();
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setAudioPlaying(true))
        .catch(() => setAudioPlaying(false));
    }
  }, []);

  const handleDismissSplash = () => {
    if (splashFading) return;

    if (audioRef.current && !audioPlaying) {
      audioRef.current
        .play()
        .then(() => setAudioPlaying(true))
        .catch(() => {});
    }

    setSplashFading(true);
    setTimeout(() => {
      setShowSplash(false);
      setCanvasVisible(true);
    }, 700);
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <audio ref={audioRef} src="/audio/background.mp3" loop />

      <div
        className={`h-full w-full transition-opacity duration-700 ease-out ${
          canvasVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Canvas className="h-full w-full">
          <color attach="background" args={["#000000"]} />
          <Scene />
        </Canvas>
      </div>

      <div className="absolute bottom-0 left-0 p-4 flex justify-center flex-col">
        <div className="absolute bottom-0 left-0 p-4 flex justify-center flex-col">
          <pre className="p-4 bg-black/50 text-white max-w-sm max-h-80 text-xs overflow-x-auto">
            {JSON.stringify(
              {
                progress: state.loadingProgress,
                phase: state.phase,
                historyLength: state.history.length,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>

      {showSplash && (
        <SplashContainer onClick={handleDismissSplash} fading={splashFading}>
          <div className="relative z-10 flex flex-col items-center gap-12">
            <Title />
            <Prompt>
              {audioPlaying
                ? "Click anywhere to begin"
                : "Click to enable audio"}
            </Prompt>
          </div>
        </SplashContainer>
      )}
    </div>
  );
}
