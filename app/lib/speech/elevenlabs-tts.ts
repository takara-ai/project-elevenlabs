import { getCached, setCache } from '../cache/blob-cache'
import { createCacheKey } from '../cache/hash'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

export interface Alignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

export interface TTSWithTimestampsResult {
  audioBase64: string
  alignment: Alignment
  cached?: boolean
}

/**
 * Generate speech with character-level timestamps from ElevenLabs
 * Checks blob cache first to avoid regenerating identical speech
 */
export async function generateSpeechWithTimestamps(
  text: string,
  voiceId: string = 'AeRdCCKzvd23BpJoofzx'
): Promise<TTSWithTimestampsResult> {
  // Check cache first
  const cacheKey = createCacheKey({ text, voiceId })
  const cached = await getCached<TTSWithTimestampsResult>('tts', cacheKey)
  if (cached) {
    console.log('[TTS] Cache hit for:', text.slice(0, 50) + '...')
    return { ...cached, cached: true }
  }

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
  
  const result: TTSWithTimestampsResult = {
    audioBase64: data.audio_base64,
    alignment: data.alignment,
  }

  // Store in cache
  await setCache('tts', cacheKey, result)
  console.log('[TTS] Cached new response for:', text.slice(0, 50) + '...')

  return { ...result, cached: false }
}

