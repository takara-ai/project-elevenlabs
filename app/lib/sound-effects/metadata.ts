'use server'

import { list, put } from '@vercel/blob'

const METADATA_FILENAME = 'sound-effects-metadata.json'

export interface SoundEffectEntry {
  prompt: string
  blobUrl: string
  createdAt: string
}

interface MetadataFile {
  entries: SoundEffectEntry[]
  version: number
}

/**
 * Get the metadata blob URL if it exists
 */
async function getMetadataBlobUrl(): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: METADATA_FILENAME })
    if (blobs.length > 0) {
      return blobs[0].url
    }
    return null
  } catch {
    return null
  }
}

/**
 * Read the current metadata file from Vercel Blob
 */
async function readMetadata(): Promise<MetadataFile> {
  try {
    const blobUrl = await getMetadataBlobUrl()
    if (!blobUrl) {
      return { entries: [], version: 1 }
    }

    const response = await fetch(blobUrl)
    if (!response.ok) {
      return { entries: [], version: 1 }
    }

    const data = await response.json()
    return data as MetadataFile
  } catch (err) {
    console.error('[Metadata] Failed to read metadata:', err)
    return { entries: [], version: 1 }
  }
}

/**
 * Write the metadata file to Vercel Blob
 */
async function writeMetadata(metadata: MetadataFile): Promise<void> {
  const content = JSON.stringify(metadata, null, 2)
  await put(METADATA_FILENAME, content, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

/**
 * Add a new sound effect entry to the metadata
 */
export async function addSoundEffectEntry(prompt: string, blobUrl: string): Promise<void> {
  const metadata = await readMetadata()
  
  const entry: SoundEffectEntry = {
    prompt,
    blobUrl,
    createdAt: new Date().toISOString(),
  }
  
  metadata.entries.push(entry)
  metadata.version++
  
  await writeMetadata(metadata)
}

/**
 * Find a sound effect by exact prompt match
 * Future: This can be enhanced with fuzzy/semantic search
 */
export async function findSoundEffectByPrompt(prompt: string): Promise<SoundEffectEntry | null> {
  const metadata = await readMetadata()
  
  // Exact match for now
  const match = metadata.entries.find(
    entry => entry.prompt.toLowerCase() === prompt.toLowerCase()
  )
  
  return match || null
}

/**
 * Get all stored sound effects
 */
export async function getAllSoundEffects(): Promise<SoundEffectEntry[]> {
  const metadata = await readMetadata()
  return metadata.entries
}

/**
 * Find similar sound effects using simple keyword matching
 * Future: Replace with proper semantic search (embeddings)
 */
export async function findSimilarSoundEffects(prompt: string, limit = 5): Promise<SoundEffectEntry[]> {
  const metadata = await readMetadata()
  
  const keywords = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  
  const scored = metadata.entries.map(entry => {
    const entryKeywords = entry.prompt.toLowerCase()
    let score = 0
    for (const keyword of keywords) {
      if (entryKeywords.includes(keyword)) {
        score++
      }
    }
    return { entry, score }
  })
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.entry)
}

