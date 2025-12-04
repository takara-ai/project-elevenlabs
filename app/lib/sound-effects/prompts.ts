import type { MoodType } from "../state-management/states";

/**
 * Build a soundstage prompt from a story setting
 */
export function buildSoundstagePrompt(setting: string): string {
  return `Ambient loopable soundscape for: ${setting.slice(0, 200)}`
}

/**
 * Build an action sound effect prompt from an action description
 */
export function buildActionSoundPrompt(action: string): string {
  return `A sound effect of the action: ${action.slice(0, 150)}`
}

/**
 * Mood-specific music descriptors for progressive game audio
 */
const MOOD_MUSIC_STYLES: Record<MoodType, string> = {
  calm: "peaceful ambient music, gentle pads, soft exploration theme, quiet wonder",
  tense: "suspenseful underscore, building tension, uneasy strings, foreboding atmosphere",
  danger: "intense action music, urgent percussion, dramatic strings, high stakes combat",
  mystery: "mysterious ethereal music, curious melodies, enigmatic tones, discovery theme",
  triumph: "triumphant orchestral swell, victorious fanfare, heroic brass, relief and joy",
};

/**
 * Build a mood music prompt combining setting context with emotional tone
 */
export function buildMoodMusicPrompt(setting: string, mood: MoodType): string {
  const moodStyle = MOOD_MUSIC_STYLES[mood];
  return `Loopable game music: ${moodStyle}. Setting: ${setting.slice(0, 100)}`
}
