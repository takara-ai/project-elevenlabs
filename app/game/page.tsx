"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState, useCallback } from "react";
import { Prompt, SplashContainer, Title } from "../../components/splash";
import { Scene } from "../_scene/scene";
import { useGameStore, GamePhase } from "../lib/state-management/states";

const FADE_DURATION_MS = 2000;
const FADE_INTERVAL_MS = 50;

export default function Home() {
  const state = useGameStore();
  const phase = useGameStore((s) => s.phase);
  const soundstageUrl = useGameStore((s) => s.soundstageUrl);

  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [bgMusicFadingOut, setBgMusicFadingOut] = useState(false);
  const [soundstagePlaying, setSoundstagePlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const soundstageRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fade out background music smoothly
  const fadeOutBackgroundMusic = useCallback(() => {
    if (!audioRef.current || bgMusicFadingOut) return;

    setBgMusicFadingOut(true);
    const audio = audioRef.current;
    const startVolume = audio.volume;
    const steps = FADE_DURATION_MS / FADE_INTERVAL_MS;
    const volumeStep = startVolume / steps;

    fadeIntervalRef.current = setInterval(() => {
      if (audio.volume > volumeStep) {
        audio.volume = Math.max(0, audio.volume - volumeStep);
      } else {
        audio.volume = 0;
        audio.pause();
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      }
    }, FADE_INTERVAL_MS);
  }, [bgMusicFadingOut]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setAudioPlaying(true))
        .catch(() => setAudioPlaying(false));
    }
  }, []);

  // Fade out background music and play soundstage when first story loads
  useEffect(() => {
    // When phase transitions to STORY (game has started), fade out bg music
    if (phase === GamePhase.STORY && !bgMusicFadingOut) {
      fadeOutBackgroundMusic();
    }

    // Play soundstage when available and story phase is active
    if (phase === GamePhase.STORY && soundstageUrl && !soundstagePlaying) {
      const audio = new Audio(soundstageUrl);
      audio.loop = true;
      audio.volume = 0;
      soundstageRef.current = audio;

      // Fade in soundstage
      audio.play()
        .then(() => {
          setSoundstagePlaying(true);
          // Fade in over 2 seconds
          const fadeIn = setInterval(() => {
            if (audio.volume < 0.25) {
              audio.volume = Math.min(0.25, audio.volume + 0.01);
            } else {
              clearInterval(fadeIn);
            }
          }, FADE_INTERVAL_MS);
        })
        .catch(console.error);
    }

    // Stop soundstage when returning to idle
    if (phase === GamePhase.IDLE && soundstageRef.current) {
      soundstageRef.current.pause();
      soundstageRef.current = null;
      setSoundstagePlaying(false);
    }
  }, [phase, soundstageUrl, soundstagePlaying, bgMusicFadingOut, fadeOutBackgroundMusic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (soundstageRef.current) {
        soundstageRef.current.pause();
        soundstageRef.current = null;
      }
    };
  }, []);

  const handleDismissSplash = () => {
    if (splashFading) return;

    if (audioRef.current && !audioPlaying) {
      audioRef.current
        .play()
        .then(() => setAudioPlaying(true))
        .catch(() => { });
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
        className={`h-full w-full transition-opacity duration-700 ease-out ${canvasVisible ? "opacity-100" : "opacity-0"
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
