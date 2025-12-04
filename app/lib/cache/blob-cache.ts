'use server'

import { list, put } from '@vercel/blob'

// Metadata filenames for different cache types
const LLM_CACHE_FILENAME = 'llm-response-cache.json'
const TTS_CACHE_FILENAME = 'tts-url-cache.json'

export type CacheType = 'llm' | 'tts'

export interface CacheEntry<T> {
  key: string
  data: T
  createdAt: string
}

interface CacheFile<T> {
  entries: CacheEntry<T>[]
  version: number
}

function getCacheFilename(type: CacheType): string {
  return type === 'llm' ? LLM_CACHE_FILENAME : TTS_CACHE_FILENAME
}

/**
 * Get the cache blob URL if it exists
 */
async function getCacheBlobUrl(type: CacheType): Promise<string | null> {
  try {
    const filename = getCacheFilename(type)
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
 * Read the current cache file from Vercel Blob
 */
async function readCache<T>(type: CacheType): Promise<CacheFile<T>> {
  try {
    const blobUrl = await getCacheBlobUrl(type)
    if (!blobUrl) {
      return { entries: [], version: 1 }
    }

    const response = await fetch(blobUrl)
    if (!response.ok) {
      return { entries: [], version: 1 }
    }

    const data = await response.json()
    return data as CacheFile<T>
  } catch (err) {
    console.error(`[Cache:${type}] Failed to read cache:`, err)
    return { entries: [], version: 1 }
  }
}

/**
 * Write the cache file to Vercel Blob
 */
async function writeCache<T>(type: CacheType, cache: CacheFile<T>): Promise<void> {
  const filename = getCacheFilename(type)
  const content = JSON.stringify(cache, null, 2)
  await put(filename, content, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

/**
 * Get cached entry by key
 */
export async function getCached<T>(type: CacheType, key: string): Promise<T | null> {
  const cache = await readCache<T>(type)
  const match = cache.entries.find(entry => entry.key === key)
  return match?.data || null
}

/**
 * Store entry in cache
 */
export async function setCache<T>(type: CacheType, key: string, data: T): Promise<void> {
  const cache = await readCache<T>(type)
  
  // Update existing or add new
  const existingIdx = cache.entries.findIndex(entry => entry.key === key)
  const entry: CacheEntry<T> = {
    key,
    data,
    createdAt: new Date().toISOString(),
  }
  
  if (existingIdx >= 0) {
    cache.entries[existingIdx] = entry
  } else {
    cache.entries.push(entry)
  }
  
  cache.version++
  await writeCache(type, cache)
}

