import { type Alignment, type MoodType } from "../state-management/states";

/**
 * Request DTO for action submission
 */
export interface ActionRequest {
  actionText: string;
  history: Array<{
    text: string;
    type: "story" | "action";
  }>;
  currentMood: MoodType | null;
  currentSetting: string | null;
}

/**
 * Response DTO for action result
 */
export interface ActionResult {
  narrativeText: string;
  actions: string[];
  audioUrl: string | null;
  alignment: Alignment | null;
  actionSoundUrl: string | null;
  mood: MoodType;
  moodMusicUrl: string | null;
}

