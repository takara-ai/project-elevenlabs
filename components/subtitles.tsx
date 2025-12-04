"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface SubtitleLine {
  text: string;
  id: number;
}

// Find the last sentence-ending punctuation
function findSentenceEnd(text: string): number {
  const endings = [". ", "! ", "? ", '."', '!"', '?"'];
  let lastEnd = -1;

  for (const ending of endings) {
    const idx = text.lastIndexOf(ending);
    if (idx > lastEnd) {
      lastEnd = idx + ending.length - 1; // Include the punctuation, not the space after
    }
  }

  // Also check for end of string punctuation
  if (text.endsWith(".") || text.endsWith("!") || text.endsWith("?")) {
    return text.length;
  }

  return lastEnd;
}

export function Subtitles({ text }: { text: string }) {
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const lineIdRef = useRef(0);
  const prevTextRef = useRef("");

  useEffect(() => {
    // Reset on new story (text got shorter)
    if (text.length < prevTextRef.current.length) {
      setLines([]);
      lineIdRef.current = 0;
      prevTextRef.current = text;
      return;
    }

    // Get only the new portion of text
    const newText = text.slice(prevTextRef.current.length);
    prevTextRef.current = text;

    if (!newText) return;

    setLines((prev) => {
      // Get the current active line
      const activeLine = prev.length > 0 ? prev[prev.length - 1] : null;

      // Build combined text from active line + new text
      const combined = (activeLine?.text || "") + newText;

      // Find the last complete sentence
      const sentenceEnd = findSentenceEnd(combined);

      // If we have a complete sentence followed by more text, split it
      if (sentenceEnd > 0 && sentenceEnd < combined.length) {
        // Complete sentence exists, extract what comes after it
        const remainder = combined.slice(sentenceEnd).trim();

        // Create a new line with the remainder (old line will slide up via AnimatePresence)
        return [
          {
            text: remainder,
            id: lineIdRef.current++,
          },
        ];
      } else {
        // No sentence break yet, or sentence ends at the end
        // Update the current line or create a new one
        if (activeLine) {
          // Update existing line
          return prev.map((l) =>
            l.id === activeLine.id ? { ...l, text: combined } : l
          );
        } else {
          // Create new line
          return [
            {
              text: combined,
              id: lineIdRef.current++,
            },
          ];
        }
      }
    });
  }, [text]);

  if (lines.length === 0) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-xl w-full flex flex-col pointer-events-none z-40 gap-2 bg-black/50">
      {lines.map((line) => (
        <p
          key={line.id}
          className="w-full text-white text-2xl font-medium tracking-wide p-4 rounded-lg max-w-3xl"
        >
          {line.text} &nbsp;
        </p>
      ))}
    </div>
  );
}
