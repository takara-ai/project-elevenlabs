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

        let next = null;
        if (index < history.length - 1) {
          next = history[index + 1];
        }
        const selectedChoice =
          next && next.type === "action" ? next.choiceIndex : null;
        return (
          <Phase
            key={index}
            phase={entry}
            isCurrentPhase={isCurrentPhase}
            offset={[0, 0, index * PHASE_HEIGHT + TOP_OFFSET]}
            selectedChoice={selectedChoice}
          />
        );
      })}
    </>
  );
}
