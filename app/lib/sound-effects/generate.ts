'use server'

import { put } from '@vercel/blob'
import { addSoundEffectEntry, findSoundEffectByPrompt } from './metadata'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

interface SoundEffectResult {
  blobUrl: string
  prompt: string
  cached: boolean
}

/**
 * Generate a loopable sound effect for a story setting
 * First checks metadata cache, then generates if not found
 */
export async function generateSoundEffect(prompt: string): Promise<SoundEffectResult> {
  // Check cache first
  const cached = await findSoundEffectByPrompt(prompt)
  if (cached) {
    return {
      blobUrl: cached.blobUrl,
      prompt: cached.prompt,
      cached: true,
    }
  }

  // Generate new sound effect from ElevenLabs
  const audioBuffer = await callElevenLabsSoundGeneration(prompt)
  
  // Upload to Vercel Blob
  const filename = `soundstage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`
  const blob = await put(filename, audioBuffer, {
    access: 'public',
    contentType: 'audio/mpeg',
  })

  // Record in metadata
  await addSoundEffectEntry(prompt, blob.url)

  return {
    blobUrl: blob.url,
    prompt,
    cached: false,
  }
}

/**
 * Call ElevenLabs sound generation API
 */
async function callElevenLabsSoundGeneration(prompt: string): Promise<Buffer> {
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
      loop: true,
      duration_seconds: 8,
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

