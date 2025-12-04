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
import { game } from "../lib/game/controller";
import { Leva } from "leva";
import { useSearchParams } from "next/navigation";

const FADE_DURATION_MS = 2000;
const FADE_INTERVAL_MS = 50;
const MOOD_MUSIC_VOLUME = 0.2;
const CROSSFADE_DURATION_MS = 3000;
const NARRATOR_DELAY_MS = 4000;

export default function Home() {
  const phase = useGameStore((s) => s.phase);
  const soundstageUrl = useGameStore((s) => s.soundstageUrl);
  const actionSoundUrl = useGameStore((s) => s.actionSoundUrl);
  const moodMusicUrl = useGameStore((s) => s.moodMusicUrl);
  const currentMood = useGameStore((s) => s.currentMood);
  const currentStory = useGameStore((s) => s.currentStory);

  const {
    isActive: triggerActive,
    label: triggerLabel,
    trigger: triggerAction,
  } = useTriggerUIStore();

  const params = useSearchParams();

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

  // Mood music refs - two audio elements for crossfading
  const moodMusicRef = useRef<HTMLAudioElement | null>(null);
  const moodMusicNextRef = useRef<HTMLAudioElement | null>(null);
  const lastMoodMusicUrlRef = useRef<string | null>(null);

  // Track last narrated story to avoid replaying
  const lastNarratedStoryIdRef = useRef<string | null>(null);
  const narratorDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Reset game state on page load
  useEffect(() => {
    game.reset();
  }, []);

  // Synced captions for narrator voice
  const { visibleText: captionText } = useCaptions(
    currentStory?.alignment ?? null,
    narratorAudioRef
  );

  // Play narrator audio after delay (to let action sound effect play first)
  useEffect(() => {
    if (!currentStory?.audioBase64 || !currentStory?.id) return;

    // Skip if already narrated this story
    if (currentStory.id === lastNarratedStoryIdRef.current) return;

    lastNarratedStoryIdRef.current = currentStory.id;

    // Clear any pending timeout
    if (narratorDelayTimeoutRef.current) {
      clearTimeout(narratorDelayTimeoutRef.current);
    }

    // Delay narrator to let action sound effect play first
    narratorDelayTimeoutRef.current = setTimeout(() => {
      if (narratorAudioRef.current) {
        narratorAudioRef.current.play().catch(console.error);
      }
    }, NARRATOR_DELAY_MS);

    return () => {
      if (narratorDelayTimeoutRef.current) {
        clearTimeout(narratorDelayTimeoutRef.current);
      }
    };
  }, [currentStory?.audioBase64, currentStory?.id]);

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

  // Progressive mood music with crossfade
  useEffect(() => {
    // Don't play mood music until game has started
    if (phase !== GamePhase.STORY || !moodMusicUrl) return;

    // Skip if same URL already playing
    if (moodMusicUrl === lastMoodMusicUrlRef.current) return;

    lastMoodMusicUrlRef.current = moodMusicUrl;

    // Create new audio for the incoming track
    const newAudio = new Audio(moodMusicUrl);
    newAudio.loop = true;
    newAudio.volume = 0;

    const oldAudio = moodMusicRef.current;
    moodMusicNextRef.current = newAudio;

    // Start playing new track
    newAudio
      .play()
      .then(() => {
        const steps = CROSSFADE_DURATION_MS / FADE_INTERVAL_MS;
        const volumeStep = MOOD_MUSIC_VOLUME / steps;
        let currentStep = 0;

        const crossfadeInterval = setInterval(() => {
          currentStep++;

          // Fade in new track
          newAudio.volume = Math.min(
            MOOD_MUSIC_VOLUME,
            newAudio.volume + volumeStep
          );

          // Fade out old track if exists
          if (oldAudio) {
            oldAudio.volume = Math.max(0, oldAudio.volume - volumeStep);
          }

          if (currentStep >= steps) {
            clearInterval(crossfadeInterval);

            // Clean up old audio
            if (oldAudio) {
              oldAudio.pause();
              oldAudio.src = "";
            }

            // Swap refs
            moodMusicRef.current = newAudio;
            moodMusicNextRef.current = null;
          }
        }, FADE_INTERVAL_MS);
      })
      .catch(console.error);
  }, [phase, moodMusicUrl]);

  // Stop mood music when returning to IDLE
  useEffect(() => {
    if (phase === GamePhase.IDLE) {
      if (moodMusicRef.current) {
        moodMusicRef.current.pause();
        moodMusicRef.current = null;
      }
      if (moodMusicNextRef.current) {
        moodMusicNextRef.current.pause();
        moodMusicNextRef.current = null;
      }
      lastMoodMusicUrlRef.current = null;
    }
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (narratorDelayTimeoutRef.current) {
        clearTimeout(narratorDelayTimeoutRef.current);
      }
      if (soundstageRef.current) {
        soundstageRef.current.pause();
        soundstageRef.current = null;
      }
      if (moodMusicRef.current) {
        moodMusicRef.current.pause();
        moodMusicRef.current = null;
      }
      if (moodMusicNextRef.current) {
        moodMusicNextRef.current.pause();
        moodMusicNextRef.current = null;
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
      <Leva collapsed hidden={!params.get("debug")} />
      <audio ref={audioRef} src="/audio/background.mp3" loop />

      {/* Narrator voice audio - hidden, plays after delay to let action sound finish */}
      {currentStory?.audioBase64 && (
        <audio
          ref={narratorAudioRef}
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
