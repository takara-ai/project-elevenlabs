import { NextResponse } from "next/server";
import { handleAction } from "@/app/lib/story-generation/action-handler";
import type { ActionRequest, ActionResult } from "@/app/lib/story-generation/dto";
import type { HistoryEntry } from "@/app/lib/state-management/states";

export async function POST(request: Request) {
  try {
    const body: ActionRequest = await request.json();

    // Convert history format from DTO to internal format
    const history: HistoryEntry[] = body.history.map((h) => {
      if (h.type === "story") {
        return {
          type: "story",
          id: Math.random().toString(36).substring(2, 15),
          narrativeText: h.text,
          actions: [], // Will be populated by the handler
          audioUrl: null,
          alignment: null,
          timestamp: Date.now(),
        };
      } else {
        return {
          type: "action",
          id: Math.random().toString(36).substring(2, 15),
          text: h.text,
          choiceIndex: 0, // Not needed for history context
          isCustom: false,
          timestamp: Date.now(),
        };
      }
    });

    const result: ActionResult = await handleAction(
      body.actionText,
      history,
      body.currentMood,
      body.currentSetting
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Action handler error:", error);
    const message = error instanceof Error ? error.message : "Action generation failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

