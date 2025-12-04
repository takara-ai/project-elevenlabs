"use client";

import { game } from "@/app/lib/game/controller";
import { add } from "@/app/lib/math";
import { HistoryEntry } from "@/app/lib/state-management/states";
import { Text } from "@react-three/drei";
import { useState } from "react";
import { useCameraStore } from "../store/camera";
import { CurverLine, StraitLine } from "./line";
import { TriggerCollider } from "./trigger-collider";

const LINE_HEIGHT = 0.05;
export const PHASE_HEIGHT = 12;
export const COLUMN_WIDTH = 4;
const BRANCH_HEIGHT = 5;
const SMOOTHING = 3;

function choiceToOption(
  choice: number | null
): "left" | "center" | "right" | null {
  if (choice === null) return null;
  if (choice === 0) return "left";
  if (choice === 1) return "center";
  if (choice === 2) return "right";
  return null;
}

export function Phase({
  phase,
  offset,
  isCurrentPhase,
  selectedChoice,
}: {
  phase: HistoryEntry;
  offset: [number, number, number];
  isCurrentPhase: boolean;
  selectedChoice: number | null;
}) {
  const [hoveredOption, setHoveredOption] = useState<
    "left" | "center" | "right" | null
  >(choiceToOption(selectedChoice));
  const addEffect = useCameraStore((state) => state.addEffect);
  const removeEffect = useCameraStore((state) => state.removeEffect);
  const setDefaultXPosition = useCameraStore(
    (state) => state.setDefaultXPosition
  );
  // Generate unique IDs for this phase's triggers
  const phaseId =
    phase.id + "-" + offset[0] + "-" + offset[1] + "-" + offset[2];
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
        <TriggerCollider
          position={add(offset, [0, LINE_HEIGHT, PHASE_HEIGHT / 2])}
          size={[COLUMN_WIDTH * 4, 3, PHASE_HEIGHT]}
          id={phaseId}
          onEnter={() => {
            setDefaultXPosition(offset[0]);
            addEffect({
              id: phaseId,
              zoom: 1,
              smooth: true,
            });
          }}
          onExit={() => {
            removeEffect(phaseId);
          }}
        />
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

    return (
      <>
        {/* Main story phase trigger - zooms camera when player enters */}
        <TriggerCollider
          position={add(offset, [0, LINE_HEIGHT, (3 * PHASE_HEIGHT) / 4])}
          size={[COLUMN_WIDTH * 4, 3, PHASE_HEIGHT / 2]}
          id={storyTriggerId}
          onEnter={() => {
            // Set default X position to offset X when entering
            setDefaultXPosition(offset[0]);
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

        {/* Left option trigger */}
        <TriggerCollider
          position={leftOptionPos}
          size={OPTION_TRIGGER_SIZE}
          id={leftTriggerId}
          onEnter={() => {
            // Always allow camera movement
            addEffect({
              id: leftTriggerId,
              zoom: 0.6,
              targetPosition: leftOptionPos,
              smooth: true,
            });
            setDefaultXPosition(leftOptionPos[0]);
            // Only update hover state if decision hasn't been taken
            if (selectedChoice === null) {
              setHoveredOption("left");
            }
          }}
          onExit={() => {
            // Always remove camera effect
            removeEffect(leftTriggerId);
            // Only update hover state if decision hasn't been taken
            if (selectedChoice === null) {
              setHoveredOption((prev) => (prev === "left" ? null : prev));
            }
          }}
          onTrigger={() => {
            // Only trigger decision if it hasn't been taken yet
            if (selectedChoice !== null) return;
            if (isCurrentPhase && phase.actions[0]) {
              game.act({ text: phase.actions[0], choiceIndex: 0 });
            }
          }}
          showProgress={selectedChoice === null}
        />

        {/* Center option trigger */}
        <TriggerCollider
          position={centerOptionPos}
          size={OPTION_TRIGGER_SIZE}
          id={centerTriggerId}
          onEnter={() => {
            // Always allow camera movement
            addEffect({
              id: centerTriggerId,
              zoom: 0.6,
              targetPosition: centerOptionPos,
              smooth: true,
            });
            // Only update hover state if decision hasn't been taken
            if (selectedChoice === null) {
              setHoveredOption("center");
            }
          }}
          onExit={() => {
            // Always remove camera effect
            removeEffect(centerTriggerId);
            // Only update hover state if decision hasn't been taken
            if (selectedChoice === null) {
              setHoveredOption((prev) => (prev === "center" ? null : prev));
            }
          }}
          onTrigger={() => {
            // Only trigger decision if it hasn't been taken yet
            if (selectedChoice !== null) return;
            if (isCurrentPhase && phase.actions[1]) {
              game.act({ text: phase.actions[1], choiceIndex: 1 });
            }
          }}
          showProgress={selectedChoice === null}
        />

        {/* Right option trigger */}
        <TriggerCollider
          position={rightOptionPos}
          size={OPTION_TRIGGER_SIZE}
          id={rightTriggerId}
          onEnter={() => {
            // Always allow camera movement
            addEffect({
              id: rightTriggerId,
              zoom: 0.6,
              targetPosition: rightOptionPos,
              smooth: true,
            });
            // Only update hover state if decision hasn't been taken
            if (selectedChoice === null) {
              setHoveredOption("right");
            }
          }}
          onExit={() => {
            // Always remove camera effect
            removeEffect(rightTriggerId);
            // Only update hover state if decision hasn't been taken
            if (selectedChoice === null) {
              setHoveredOption((prev) => (prev === "right" ? null : prev));
            }
          }}
          onTrigger={() => {
            // Only trigger decision if it hasn't been taken yet
            if (selectedChoice !== null) return;
            if (!isCurrentPhase) return;
            const prompt = window.prompt("What do you want to do?");
            if (prompt) {
              game.act({ text: prompt, choiceIndex: 2 });
            }
            removeEffect(rightTriggerId);
          }}
          showProgress={selectedChoice === null}
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
