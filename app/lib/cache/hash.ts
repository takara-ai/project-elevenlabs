import { createHash } from 'crypto'

/**
 * Create a deterministic hash key from any input
 */
export function createCacheKey(input: unknown): string {
  const str = typeof input === 'string' ? input : JSON.stringify(input)
  return createHash('sha256').update(str).digest('hex').slice(0, 16)
}

