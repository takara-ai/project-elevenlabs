import { put } from '@vercel/blob'
import { getCached, setCache } from '../cache/blob-cache'
import { createCacheKey } from '../cache/hash'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

export interface Alignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

// Cached data stored in metadata (URL + alignment only)
interface TTSCacheData {
  audioUrl: string
  alignment: Alignment
}

export interface TTSWithTimestampsResult {
  audioUrl: string
  alignment: Alignment
  cached?: boolean
}

/**
 * Generate speech with character-level timestamps from ElevenLabs
 * Stores audio as blob, returns CDN URL for fast loading
 */
export async function generateSpeechWithTimestamps(
  text: string,
  voiceId: string = 'AeRdCCKzvd23BpJoofzx'
): Promise<TTSWithTimestampsResult> {
  // Check cache first
  const cacheKey = createCacheKey({ text, voiceId })
  const cached = await getCached<TTSCacheData>('tts', cacheKey)
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
  
  // Convert base64 to buffer and upload to blob storage
  const audioBuffer = Buffer.from(data.audio_base64, 'base64')
  const filename = `tts-${cacheKey}-${Date.now()}.mp3`
  const blob = await put(filename, audioBuffer, {
    access: 'public',
    contentType: 'audio/mpeg',
  })

  // Store URL + alignment in cache metadata
  const cacheData: TTSCacheData = {
    audioUrl: blob.url,
    alignment: data.alignment,
  }
  await setCache('tts', cacheKey, cacheData)
  console.log('[TTS] Cached new response for:', text.slice(0, 50) + '...')

  return { ...cacheData, cached: false }
}

