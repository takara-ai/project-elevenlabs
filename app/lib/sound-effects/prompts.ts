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
