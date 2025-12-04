"use client";

import { Text } from "@react-three/drei";

export function Tutorial({ text }: { text: string }) {
  return (
    <group>
      <TutorialText text="Welcome to the tutorial!" position={[0, 0, 0]} />
    </group>
  );
}

function TutorialText({
  text,
  position,
}: {
  text: string;
  position: [number, number, number];
}) {
  // Helper to insert line breaks every ~32 chars at word boundaries
  function wrapText(input: string, maxLen: number = 32): string[] {
    const lines: string[] = [];
    let remaining = input.trim();
    while (remaining.length > maxLen) {
      // Find the last space within maxLen
      let breakIdx = remaining.lastIndexOf(" ", maxLen);
      if (breakIdx === -1) breakIdx = maxLen;
      lines.push(remaining.slice(0, breakIdx).trim());
      remaining = remaining.slice(breakIdx).trim();
    }
    if (remaining) lines.push(remaining);
    return lines;
  }

  const lines = wrapText(text);

  const LINE_HEIGHT = 0.28;
  const LINE_OFFSET = 0.6;
  const FONT_SIZE = 0.23;

  return (
    <group>
      {lines.map((line, i) => (
        <Text
          key={i}
          position={[
            position[0],
            position[1],
            position[2] + LINE_OFFSET + i * LINE_HEIGHT,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          font="/young.ttf"
          fontSize={FONT_SIZE}
          color="#fff"
          anchorX="center"
          anchorY="middle"
        >
          {line}
        </Text>
      ))}
    </group>
  );
}
