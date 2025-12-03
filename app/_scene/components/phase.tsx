"use client";

import { add } from "@/app/lib/math";
import {
  HistoryEntry,
  GamePhase,
  useGameStore,
} from "@/app/lib/state-management/states";
import { game } from "@/app/lib/game/controller";
import { Text } from "@react-three/drei";
import { useState } from "react";
import { TriggerCollider } from "./trigger-collider";
import { useCameraStore } from "../store/camera";
import { CurverLine, StraitLine } from "./line";

const LINE_HEIGHT = 0.05;
export const PHASE_HEIGHT = 12;
export const COLUMN_WIDTH = 4;
const BRANCH_HEIGHT = 5;
const SMOOTHING = 3;

export function Phase({
  phase,
  offset,
  isCurrentPhase,
}: {
  phase: HistoryEntry;
  offset: [number, number, number];
  isCurrentPhase: boolean;
}) {
  const [hoveredOption, setHoveredOption] = useState<
    "left" | "center" | "right" | null
  >(null);
  const addEffect = useCameraStore((state) => state.addEffect);
  const removeEffect = useCameraStore((state) => state.removeEffect);
  const gamePhase = useGameStore((state) => state.phase);
  const canTriggerChoice = isCurrentPhase && gamePhase === GamePhase.ACTION;

  // Generate unique IDs for this phase's triggers
  const phaseId = phase.id;
  const leftTriggerId = `${phaseId}-left`;
  const centerTriggerId = `${phaseId}-center`;
  const rightTriggerId = `${phaseId}-right`;
  const storyTriggerId = `${phaseId}-story`;

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
    const leftOptionPos = add(offset, [
      -COLUMN_WIDTH,
      LINE_HEIGHT,
      PHASE_HEIGHT,
    ]);
    const centerOptionPos = add(offset, [0, LINE_HEIGHT, PHASE_HEIGHT]);
    const rightOptionPos = add(offset, [
      COLUMN_WIDTH,
      LINE_HEIGHT,
      PHASE_HEIGHT,
    ]);

    // Trigger box size for option selection
    const OPTION_TRIGGER_SIZE: [number, number, number] = [3, 3, 3];
    // Trigger box for the entire story phase area (for camera zoom)
    const STORY_TRIGGER_SIZE: [number, number, number] = [
      COLUMN_WIDTH * 6,
      5,
      BRANCH_HEIGHT + 4,
    ];
    const storyTriggerPos = add(offset, [
      0,
      LINE_HEIGHT,
      PHASE_HEIGHT - BRANCH_HEIGHT / 2,
    ]);

    return (
      <>
        {/* Main story phase trigger - zooms camera when player enters */}
        {isCurrentPhase && (
          <TriggerCollider
            position={storyTriggerPos}
            size={STORY_TRIGGER_SIZE}
            id={storyTriggerId}
            onEnter={() => {
              // Zoom camera when entering story phase
              addEffect({
                id: storyTriggerId,
                zoom: 0.6,
                smooth: true,
              });
            }}
            onExit={() => {
              // Remove zoom when exiting
              removeEffect(storyTriggerId);
            }}
          />
        )}

        {/* Left option trigger */}
        <TriggerCollider
          position={leftOptionPos}
          size={OPTION_TRIGGER_SIZE}
          id={leftTriggerId}
          onEnter={() => {
            setHoveredOption("left");
            // Center camera on left choice, keep zoom at 0.6
            addEffect({
              id: leftTriggerId,
              zoom: 0.6,
              targetPosition: leftOptionPos,
              smooth: true,
            });
          }}
          onExit={() => {
            setHoveredOption((prev) => (prev === "left" ? null : prev));
            removeEffect(leftTriggerId);
          }}
          onTrigger={() => {
            if (canTriggerChoice && phase.actions[0]) {
              game.act(phase.actions[0]);
            }
          }}
          triggerDuration={5}
        />

        {/* Center option trigger */}
        <TriggerCollider
          position={centerOptionPos}
          size={OPTION_TRIGGER_SIZE}
          id={centerTriggerId}
          onEnter={() => {
            setHoveredOption("center");
            // Center camera on center choice, keep zoom at 0.6
            addEffect({
              id: centerTriggerId,
              zoom: 0.6,
              targetPosition: centerOptionPos,
              smooth: true,
            });
          }}
          onExit={() => {
            setHoveredOption((prev) => (prev === "center" ? null : prev));
            removeEffect(centerTriggerId);
          }}
          onTrigger={() => {
            if (canTriggerChoice && phase.actions[1]) {
              game.act(phase.actions[1]);
            }
          }}
          triggerDuration={5}
        />

        {/* Right option trigger */}
        <TriggerCollider
          position={rightOptionPos}
          size={OPTION_TRIGGER_SIZE}
          id={rightTriggerId}
          onEnter={() => {
            setHoveredOption("right");
            // Center camera on right choice, keep zoom at 0.6
            addEffect({
              id: rightTriggerId,
              zoom: 0.6,
              targetPosition: rightOptionPos,
              smooth: true,
            });
          }}
          onExit={() => {
            setHoveredOption((prev) => (prev === "right" ? null : prev));
            removeEffect(rightTriggerId);
          }}
          onTrigger={() => {
            const prompt = window.prompt("What do you want to do?");
            if (prompt) {
              game.act(prompt);
            }
            removeEffect(rightTriggerId);
          }}
          triggerDuration={5}
        />

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

  const LINE_HEIGHT = 0.24;
  const LINE_OFFSET = 0.6;
  const FONT_SIZE = 0.2;

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
