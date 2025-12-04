// This file is deprecated - TTS is now handled client-side via /api/tts route
// Keeping for backwards compatibility with test pages

export interface Alignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

export interface TTSWithTimestampsResult {
  audioBase64: string
  alignment: Alignment
}
