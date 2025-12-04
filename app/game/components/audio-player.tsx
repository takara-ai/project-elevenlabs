"use client";

import { useEffect, useRef } from "react";
import { useGameStore, GamePhase } from "@/app/lib/state-management/states";
import { useCaptions } from "@/app/lib/speech/captions";

/**
 * Handles all game audio playback:
 * - Soundstage (looping background audio)
 * - Action sound effects (one-shot)
 * - Narrator voice (from story audioBase64)
 */
export function AudioPlayer() {
  const phase = useGameStore((s) => s.phase);
  const soundstageUrl = useGameStore((s) => s.soundstageUrl);
  const actionSoundUrl = useGameStore((s) => s.actionSoundUrl);
  const currentStory = useGameStore((s) => s.currentStory);

  // Soundstage audio (looping background)
  const soundstageRef = useRef<HTMLAudioElement | null>(null);

  // Narrator audio
  const narratorAudioRef = useRef<HTMLAudioElement | null>(null);
  useCaptions(currentStory?.alignment ?? null, narratorAudioRef);

  // Track which action sound URL was last played
  const lastPlayedActionSoundRef = useRef<string | null>(null);

  // Play soundstage when story starts and URL is available
  useEffect(() => {
    if (phase === GamePhase.STORY && soundstageUrl && !soundstageRef.current) {
      const audio = new Audio(soundstageUrl);
      audio.loop = true;
      audio.volume = 0.25;
      soundstageRef.current = audio;
      audio.play().catch(console.error);
    }

    // Stop soundstage when returning to idle
    if (phase === GamePhase.IDLE && soundstageRef.current) {
      soundstageRef.current.pause();
      soundstageRef.current = null;
    }
  }, [phase, soundstageUrl]);

  // Play action sound effect when a new actionSoundUrl is set
  useEffect(() => {
    if (actionSoundUrl && actionSoundUrl !== lastPlayedActionSoundRef.current) {
      lastPlayedActionSoundRef.current = actionSoundUrl;
      const audio = new Audio(actionSoundUrl);
      audio.volume = 0.7;
      audio.play().catch(console.error);
    }
  }, [actionSoundUrl]);

  // Play narrator audio when currentStory changes and has audio
  useEffect(() => {
    if (currentStory?.audioBase64 && narratorAudioRef.current) {
      // Use data URL format (same as test-states page)
      const dataUrl = `data:audio/mpeg;base64,${currentStory.audioBase64}`;

      // Clean up previous audio
      if (narratorAudioRef.current.src) {
        const oldUrl = narratorAudioRef.current.src;
        narratorAudioRef.current.pause();
        narratorAudioRef.current.src = "";
        if (oldUrl.startsWith("blob:")) {
          URL.revokeObjectURL(oldUrl);
        }
      }

      narratorAudioRef.current.src = dataUrl;
      narratorAudioRef.current.play().catch(console.error);
    }
  }, [currentStory?.audioBase64, currentStory?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundstageRef.current) {
        soundstageRef.current.pause();
        soundstageRef.current = null;
      }
      if (narratorAudioRef.current) {
        narratorAudioRef.current.pause();
        if (narratorAudioRef.current.src.startsWith("blob:")) {
          URL.revokeObjectURL(narratorAudioRef.current.src);
        }
        narratorAudioRef.current = null;
      }
    };
  }, []);

  return <audio ref={narratorAudioRef} />;
}
