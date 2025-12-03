'use server'

import { put } from '@vercel/blob'
import { addSoundEffectEntry, findSoundEffectByPrompt, type SoundEffectType } from './metadata'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const DISABLE_SOUND_EFFECTS = process.env.DISABLE_SOUND_EFFECTS === 'true'

interface SoundEffectResult {
  blobUrl: string
  prompt: string
  cached: boolean
}

/**
 * Generate a loopable sound effect for a story setting (soundstage)
 * First checks metadata cache, then generates if not found
 */
export async function generateSoundEffect(prompt: string): Promise<SoundEffectResult> {
  if (DISABLE_SOUND_EFFECTS) {
    return { blobUrl: '', prompt, cached: false }
  }

  // Check cache first
  const cached = await findSoundEffectByPrompt('soundstage', prompt)
  if (cached) {
    return {
      blobUrl: cached.blobUrl,
      prompt: cached.prompt,
      cached: true,
    }
  }

  // Generate new sound effect from ElevenLabs
  const audioBuffer = await callElevenLabsSoundGeneration(prompt, { loop: true, duration: 8 })
  
  // Upload to Vercel Blob
  const filename = `soundstage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`
  const blob = await put(filename, audioBuffer, {
    access: 'public',
    contentType: 'audio/mpeg',
  })

  // Record in metadata
  await addSoundEffectEntry('soundstage', prompt, blob.url)

  return {
    blobUrl: blob.url,
    prompt,
    cached: false,
  }
}

/**
 * Generate an action sound effect (short, non-looping)
 * First checks metadata cache, then generates if not found
 */
export async function generateActionSoundEffect(prompt: string): Promise<SoundEffectResult> {
  if (DISABLE_SOUND_EFFECTS) {
    return { blobUrl: '', prompt, cached: false }
  }

  // Check cache first
  const cached = await findSoundEffectByPrompt('action', prompt)
  if (cached) {
    return {
      blobUrl: cached.blobUrl,
      prompt: cached.prompt,
      cached: true,
    }
  }

  // Generate new action sound effect from ElevenLabs (shorter, non-looping)
  const audioBuffer = await callElevenLabsSoundGeneration(prompt, { loop: false, duration: 4 })
  
  // Upload to Vercel Blob
  const filename = `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`
  const blob = await put(filename, audioBuffer, {
    access: 'public',
    contentType: 'audio/mpeg',
  })

  // Record in metadata
  await addSoundEffectEntry('action', prompt, blob.url)

  return {
    blobUrl: blob.url,
    prompt,
    cached: false,
  }
}

interface SoundGenerationOptions {
  loop: boolean
  duration: number
}

/**
 * Call ElevenLabs sound generation API
 */
async function callElevenLabsSoundGeneration(
  prompt: string,
  options: SoundGenerationOptions
): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY environment variable not set')
  }

  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: prompt,
      loop: options.loop,
      duration_seconds: options.duration,
      prompt_influence: 0.5,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs sound generation failed: ${response.status} - ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

