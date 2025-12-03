// Narrator prompt engineering

const SYSTEM_PROMPT = (isFirstCycle: boolean) => `You are a narrator for an interactive story.

${isFirstCycle 
  ? `Your role:
- Write 3 paragraphs of atmospheric world-building
- Establish the setting, mood, and stakes
- End with a moment of decision`
  : `Your role:
- Describe scenes in 2-3 atmospheric sentences
- Include sensory details and tension
- End at a moment of decision`}

- Provide 3 distinct, meaningful action choices`

export function buildNarratorMessages(
  setting: string,
  history: { text: string; type: 'story' | 'action' }[],
  isFirstCycle: boolean
) {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: `${SYSTEM_PROMPT(isFirstCycle)}\n\nSETTING: ${setting}` },
  ]

  if (history.length === 0) {
    messages.push({ role: 'user', content: 'Begin the story.' })
  } else {
    for (const entry of history) {
      messages.push({
        role: entry.type === 'story' ? 'assistant' : 'user',
        content: entry.text,
      })
    }
    messages.push({ role: 'user', content: 'Continue.' })
  }

  return messages
}
