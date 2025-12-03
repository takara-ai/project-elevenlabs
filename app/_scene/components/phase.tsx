"use client";

import { add } from "@/app/lib/math";
import { HistoryEntry } from "@/app/lib/state-management/states";
import { Text } from "@react-three/drei";
import { useMemo } from "react";
import { useCursorStore } from "../store/cursor";
import { CurverLine, StraitLine } from "./line";

const LINE_HEIGHT = 0.05;
export const PHASE_HEIGHT = 12;
export const COLUMN_WIDTH = 2;
const BRANCH_HEIGHT = 3;
const SMOOTHING = 2;

export function Phase({
  phase,
  offset,
  isCurrentPhase,
}: {
  phase: HistoryEntry;
  offset: [number, number, number];
  isCurrentPhase: boolean;
}) {
  const cursorPosX = useCursorStore((state) => state.worldX);
  const cursorPosY = useCursorStore((state) => state.worldY);
  const cursorPosZ = useCursorStore((state) => state.worldZ);
  const cursorPos = [cursorPosX, cursorPosY, cursorPosZ];

  const hoveredOption = useMemo(() => {
    if (phase.type !== "story") return null;
    const x = cursorPos[0];
    const xOffset = offset[0];
    // Compare distance to -COLUMN_WIDTH, 0, and +COLUMN_WIDTH
    const dists = [
      { label: "left", value: Math.abs(x - (xOffset - COLUMN_WIDTH)) },
      { label: "center", value: Math.abs(x - xOffset) },
      { label: "right", value: Math.abs(x - (xOffset + COLUMN_WIDTH)) },
    ];
    // Find the closest
    dists.sort((a, b) => a.value - b.value);
    return dists[0].label as "left" | "center" | "right";
  }, [phase, cursorPos, offset]);

  if (phase.type === "action") {
    return (
      <>
        <StraitLine
          start={add(offset, [0, LINE_HEIGHT, 0])}
          end={add(offset, [0, LINE_HEIGHT, PHASE_HEIGHT])}
        />
        <mesh position={add(offset, [0, LINE_HEIGHT, PHASE_HEIGHT])}>
          <sphereGeometry args={[0.2, 20, 20]} />
          <meshStandardMaterial
            color="white"
            emissive="white"
            emissiveIntensity={1}
          />
        </mesh>
      </>
    );
  }
  if (phase.type === "story") {
    return (
      <>
        <StraitLine
          start={add(offset, [0, LINE_HEIGHT, 0])}
          end={add(offset, [0, LINE_HEIGHT, PHASE_HEIGHT - BRANCH_HEIGHT])}
        />
        <CurverLine
          start={add(offset, [0, LINE_HEIGHT, PHASE_HEIGHT - BRANCH_HEIGHT])}
          end={add(offset, [-COLUMN_WIDTH, LINE_HEIGHT, PHASE_HEIGHT])}
          controlPoints={[
            add(offset, [
              0,
              LINE_HEIGHT,
              PHASE_HEIGHT - BRANCH_HEIGHT + SMOOTHING,
            ]),
            add(offset, [-COLUMN_WIDTH, LINE_HEIGHT, PHASE_HEIGHT - SMOOTHING]),
          ]}
          disabled={hoveredOption !== "left"}
        />
        <CurverLine
          start={add(offset, [0, LINE_HEIGHT, PHASE_HEIGHT - BRANCH_HEIGHT])}
          end={add(offset, [0, LINE_HEIGHT, PHASE_HEIGHT])}
          disabled={hoveredOption !== "center"}
        />
        <CurverLine
          start={add(offset, [0, LINE_HEIGHT, PHASE_HEIGHT - BRANCH_HEIGHT])}
          end={add(offset, [COLUMN_WIDTH, LINE_HEIGHT, PHASE_HEIGHT])}
          controlPoints={[
            add(offset, [
              0,
              LINE_HEIGHT,
              PHASE_HEIGHT - BRANCH_HEIGHT + SMOOTHING,
            ]),
            add(offset, [COLUMN_WIDTH, LINE_HEIGHT, PHASE_HEIGHT - SMOOTHING]),
          ]}
          disabled={hoveredOption !== "right"}
        />
        <ActionText
          text={phase.actions[0]}
          position={add(offset, [-COLUMN_WIDTH, LINE_HEIGHT, PHASE_HEIGHT])}
        />
        <ActionText
          text={phase.actions[1]}
          position={add(offset, [0, LINE_HEIGHT, PHASE_HEIGHT])}
        />
        <ActionText
          text={"Make a choice..."}
          position={add(offset, [COLUMN_WIDTH, LINE_HEIGHT, PHASE_HEIGHT])}
        />
      </>
    );
  }
}

function ActionText({
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

  const LINE_HEIGHT = 0.15;
  const LINE_OFFSET = 0.5;
  const FONT_SIZE = 0.13;

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
          font="/black-vesper.ttf"
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
