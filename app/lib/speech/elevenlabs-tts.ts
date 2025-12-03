const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

export interface Alignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

export interface TTSWithTimestampsResult {
  audioBase64: string
  alignment: Alignment
}

/**
 * Generate speech with character-level timestamps from ElevenLabs
 */
export async function generateSpeechWithTimestamps(
  text: string,
  voiceId: string = 'AeRdCCKzvd23BpJoofzx'
): Promise<TTSWithTimestampsResult> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not set')
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs TTS failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  return {
    audioBase64: data.audio_base64,
    alignment: data.alignment,
  }
}

