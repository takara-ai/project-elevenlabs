// This file is deprecated - story generation is now handled in action-handler.ts
// TTS is handled client-side via streaming

export interface GeneratedStory {
  narrativeText: string;
  actions: string[];
}
