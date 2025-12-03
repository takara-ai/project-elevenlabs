import { useGameStore } from "@/app/lib/state-management/states";
import { Phase, PHASE_HEIGHT } from "./phase";

export const TOP_OFFSET = 0.5;

export function History() {
  const state = useGameStore();
  const history = state.history;
  return (
    <>
      {history.map((entry, index) => {
        const isCurrentPhase = index === history.length - 1;
        return (
          <Phase
            key={index}
            phase={entry}
            isCurrentPhase={isCurrentPhase}
            offset={[0, 0, index * PHASE_HEIGHT + TOP_OFFSET]}
          />
        );
      })}
    </>
  );
}
