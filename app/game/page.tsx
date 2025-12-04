"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState, useCallback } from "react";
import { Prompt, SplashContainer, Title } from "../../components/splash";
import { Subtitles } from "../../components/subtitles";
import { TriggerOverlay } from "../../components/trigger-overlay";
import { Scene } from "../_scene/scene";
import { useGameStore, GamePhase } from "../lib/state-management/states";
import { useCaptions } from "../lib/speech/captions";
import { useTriggerUIStore } from "../_scene/store/trigger-ui";
import { AutoscrollButton } from "../_scene/components/autoscroll-button";

const FADE_DURATION_MS = 2000;
const FADE_INTERVAL_MS = 50;

export default function Home() {
  const phase = useGameStore((s) => s.phase);
  const soundstageUrl = useGameStore((s) => s.soundstageUrl);
  const actionSoundUrl = useGameStore((s) => s.actionSoundUrl);
  const currentStory = useGameStore((s) => s.currentStory);

  const {
    isActive: triggerActive,
    label: triggerLabel,
    trigger: triggerAction,
  } = useTriggerUIStore();

  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [bgMusicFadingOut, setBgMusicFadingOut] = useState(false);
  const [soundstagePlaying, setSoundstagePlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const soundstageRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedActionSoundRef = useRef<string | null>(null);
  const narratorAudioRef = useRef<HTMLAudioElement | null>(null);

  // Synced captions for narrator voice
  const { visibleText: captionText } = useCaptions(
    currentStory?.alignment ?? null,
    narratorAudioRef
  );

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
      audio
        .play()
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
  }, [
    phase,
    soundstageUrl,
    soundstagePlaying,
    bgMusicFadingOut,
    fadeOutBackgroundMusic,
  ]);

  // Play action sound effect when a new actionSoundUrl is set
  useEffect(() => {
    if (actionSoundUrl && actionSoundUrl !== lastPlayedActionSoundRef.current) {
      lastPlayedActionSoundRef.current = actionSoundUrl;
      const audio = new Audio(actionSoundUrl);
      audio.volume = 0.45;
      audio.play().catch(console.error);
    }
  }, [actionSoundUrl]);

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
        .catch(() => {});
    }

    setSplashFading(true);
    setTimeout(() => {
      setShowSplash(false);
      setCanvasVisible(true);
    }, 700);
  };

  // Handle click to trigger action
  const handleTriggerClick = (e: React.MouseEvent) => {
    // Only trigger if trigger UI is active and not clicking on splash
    if (triggerActive && !showSplash) {
      e.stopPropagation();
      triggerAction();
    }
  };

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
        triggerActive && !showSplash ? "cursor-pointer" : ""
      }`}
      onClick={handleTriggerClick}
    >
      <audio ref={audioRef} src="/audio/background.mp3" loop />

      {/* Narrator voice audio - hidden, auto-plays when story loads */}
      {currentStory?.audioBase64 && (
        <audio
          ref={narratorAudioRef}
          autoPlay
          src={`data:audio/mpeg;base64,${currentStory.audioBase64}`}
          className="hidden"
        />
      )}

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

      {/* Subtitles overlay */}
      {phase === GamePhase.STORY && <Subtitles text={captionText} />}

      {/* Autoscroll button */}
      <AutoscrollButton />

      {/* Trigger UI overlay */}
      {!showSplash && (
        <TriggerOverlay isActive={triggerActive} label={triggerLabel} />
      )}

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
