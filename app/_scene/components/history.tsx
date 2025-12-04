import { useGameStore } from "@/app/lib/state-management/states";
import { COLUMN_WIDTH, Phase, PHASE_HEIGHT } from "./phase";

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

        let currentColumn = 0;

        history.slice(0, index + 1).forEach((entry) => {
          if (entry.type === "action") {
            currentColumn += entry.choiceIndex - 1;
          }
        });

        return (
          <Phase
            key={index}
            phase={entry}
            isCurrentPhase={isCurrentPhase}
            offset={[
              currentColumn * COLUMN_WIDTH,
              0,
              index * PHASE_HEIGHT + TOP_OFFSET,
            ]}
            selectedChoice={selectedChoice}
          />
        );
      })}
    </>
  );
}
