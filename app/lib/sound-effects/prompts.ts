/**
 * Build a soundstage prompt from a story setting
 */
export function buildSoundstagePrompt(setting: string): string {
  return `Ambient loopable soundscape for: ${setting.slice(0, 200)}`
}
