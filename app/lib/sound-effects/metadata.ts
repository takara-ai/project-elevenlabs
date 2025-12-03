'use server'

import { list, put } from '@vercel/blob'

// Separate metadata files for different sound effect types
const SOUNDSTAGE_METADATA_FILENAME = 'soundstage-effects-metadata.json'
const ACTION_METADATA_FILENAME = 'action-effects-metadata.json'

export type SoundEffectType = 'soundstage' | 'action'

export interface SoundEffectEntry {
  prompt: string
  blobUrl: string
  createdAt: string
}

interface MetadataFile {
  entries: SoundEffectEntry[]
  version: number
}

function getMetadataFilename(type: SoundEffectType): string {
  return type === 'soundstage' ? SOUNDSTAGE_METADATA_FILENAME : ACTION_METADATA_FILENAME
}

/**
 * Get the metadata blob URL if it exists
 */
async function getMetadataBlobUrl(type: SoundEffectType): Promise<string | null> {
  try {
    const filename = getMetadataFilename(type)
    const { blobs } = await list({ prefix: filename })
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
async function readMetadata(type: SoundEffectType): Promise<MetadataFile> {
  try {
    const blobUrl = await getMetadataBlobUrl(type)
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
    console.error(`[Metadata:${type}] Failed to read metadata:`, err)
    return { entries: [], version: 1 }
  }
}

/**
 * Write the metadata file to Vercel Blob
 */
async function writeMetadata(type: SoundEffectType, metadata: MetadataFile): Promise<void> {
  const filename = getMetadataFilename(type)
  const content = JSON.stringify(metadata, null, 2)
  await put(filename, content, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

/**
 * Add a new sound effect entry to the metadata
 */
export async function addSoundEffectEntry(
  type: SoundEffectType,
  prompt: string,
  blobUrl: string
): Promise<void> {
  const metadata = await readMetadata(type)
  
  const entry: SoundEffectEntry = {
    prompt,
    blobUrl,
    createdAt: new Date().toISOString(),
  }
  
  metadata.entries.push(entry)
  metadata.version++
  
  await writeMetadata(type, metadata)
}

/**
 * Find a sound effect by exact prompt match
 * Future: This can be enhanced with fuzzy/semantic search
 */
export async function findSoundEffectByPrompt(
  type: SoundEffectType,
  prompt: string
): Promise<SoundEffectEntry | null> {
  const metadata = await readMetadata(type)
  
  // Exact match for now
  const match = metadata.entries.find(
    entry => entry.prompt.toLowerCase() === prompt.toLowerCase()
  )
  
  return match || null
}

/**
 * Get all stored sound effects of a specific type
 */
export async function getAllSoundEffects(type: SoundEffectType): Promise<SoundEffectEntry[]> {
  const metadata = await readMetadata(type)
  return metadata.entries
}

/**
 * Find similar sound effects using simple keyword matching
 * Future: Replace with proper semantic search (embeddings)
 */
export async function findSimilarSoundEffects(
  type: SoundEffectType,
  prompt: string,
  limit = 5
): Promise<SoundEffectEntry[]> {
  const metadata = await readMetadata(type)
  
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

