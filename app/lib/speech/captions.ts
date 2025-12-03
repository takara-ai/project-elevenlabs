"use client";

/**
 * Synced Captions Hook
 *
 * Usage:
 *   const audioRef = useRef<HTMLAudioElement>(null)
 *   const { visibleText } = useCaptions(currentStory?.alignment ?? null, audioRef)
 *
 *   <audio ref={audioRef} src={...} />
 *   <p>{visibleText}</p>
 *
 * Alignment data comes from ElevenLabs /with-timestamps endpoint via currentStory.alignment
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { Alignment } from "../state-management/states";

interface CaptionState {
  visibleText: string
  currentCharIndex: number
}
export function useCaptions(
  alignment: Alignment | null,
  audioRef: React.RefObject<HTMLAudioElement | null>
) {
  const [state, setState] = useState<CaptionState>({ visibleText: "", currentCharIndex: -1 });
  const rafRef = useRef<number | null>(null);

  const updateCaption = useCallback(() => {
    if (!alignment || !audioRef.current) {
      rafRef.current = requestAnimationFrame(updateCaption);
      return;
    }

    const currentTime = audioRef.current.currentTime;
    const { characters, character_end_times_seconds } = alignment;

    // Find the last character that has started
    let charIndex = -1;
    for (let i = 0; i < character_end_times_seconds.length; i++) {
      if (character_end_times_seconds[i] <= currentTime) {
        charIndex = i;
      } else {
        break;
      }
    }

    // Build visible text up to current character
    const visibleText = characters.slice(0, charIndex + 1).join("");

    setState({ visibleText, currentCharIndex: charIndex });
    rafRef.current = requestAnimationFrame(updateCaption);
  }, [alignment, audioRef]);

  useEffect(() => {
    if (!alignment) {
      setState({ visibleText: "", currentCharIndex: -1 });
      return;
    }

    rafRef.current = requestAnimationFrame(updateCaption);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [alignment, updateCaption]);

  const reset = useCallback(() => {
    setState({ visibleText: "", currentCharIndex: -1 });
  }, []);

  return { ...state, reset };
}

