"use client"

import { useRef, useCallback, useState, useEffect } from 'react'
import type { Alignment } from '../state-management/states'

function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64.replace(/\s/g, '')), c => c.charCodeAt(0))
}

export function useStreamingAudio() {
  const [alignment, setAlignment] = useState<Alignment | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaSourceRef = useRef<MediaSource | null>(null)
  const sourceBufferRef = useRef<SourceBuffer | null>(null)
  const rafRef = useRef<number | null>(null)
  const alignmentsRef = useRef<Alignment[]>([])
  const pendingChunksRef = useRef<Uint8Array[]>([])
  const isAppendingRef = useRef(false)

  // Update currentTime while playing
  useEffect(() => {
    if (!isPlaying) return
    const tick = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isPlaying])

  const appendNextChunk = useCallback(() => {
    const sourceBuffer = sourceBufferRef.current
    if (!sourceBuffer || isAppendingRef.current || pendingChunksRef.current.length === 0) return
    if (sourceBuffer.updating) return

    isAppendingRef.current = true
    const chunk = pendingChunksRef.current.shift()!
    try {
      sourceBuffer.appendBuffer(new Uint8Array(chunk).buffer as ArrayBuffer)
    } catch (e) {
      console.warn('[TTS] appendBuffer error:', e)
      isAppendingRef.current = false
    }
  }, [])

  const play = useCallback(async (text: string) => {
    // Reset state
    setAlignment(null)
    setCurrentTime(0)
    alignmentsRef.current = []
    pendingChunksRef.current = []
    isAppendingRef.current = false

    // Create MediaSource
    const mediaSource = new MediaSource()
    mediaSourceRef.current = mediaSource
    
    // Create audio element
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }
    const audio = audioRef.current
    audio.src = URL.createObjectURL(mediaSource)

    // Wait for MediaSource to open
    await new Promise<void>((resolve) => {
      mediaSource.addEventListener('sourceopen', () => resolve(), { once: true })
    })

    // Create SourceBuffer for MP3
    const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
    sourceBufferRef.current = sourceBuffer
    
    sourceBuffer.addEventListener('updateend', () => {
      isAppendingRef.current = false
      appendNextChunk()
    })

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!response.ok || !response.body) {
      throw new Error('Failed to fetch audio stream')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let chunkCount = 0
    let hasStartedPlaying = false
    const MIN_CHUNKS_TO_START = 3

    const updateAlignment = () => {
      const merged: Alignment = {
        characters: alignmentsRef.current.flatMap(a => a.characters),
        character_start_times_seconds: alignmentsRef.current.flatMap(a => a.character_start_times_seconds),
        character_end_times_seconds: alignmentsRef.current.flatMap(a => a.character_end_times_seconds),
      }
      setAlignment(merged)
    }

    audio.onended = () => setIsPlaying(false)
    audio.onplay = () => setIsPlaying(true)

    // Process stream
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const chunk = JSON.parse(line)
          
          if (chunk.audio_base64) {
            chunkCount++
            const bytes = base64ToBytes(chunk.audio_base64)
            pendingChunksRef.current.push(bytes)
            appendNextChunk()
            console.log(`[TTS] Chunk ${chunkCount}: ${bytes.length} bytes`)

            // Start playing after buffering MIN_CHUNKS
            if (!hasStartedPlaying && chunkCount >= MIN_CHUNKS_TO_START) {
              hasStartedPlaying = true
              audio.play().catch(console.error)
            }
          }
          
          if (chunk.alignment) {
            alignmentsRef.current.push(chunk.alignment)
            updateAlignment()
          }
        } catch { /* skip invalid JSON */ }
      }
    }

    console.log(`[TTS] Complete: ${chunkCount} chunks`)

    // End the stream when done
    const waitForBuffer = () => {
      if (sourceBuffer.updating || pendingChunksRef.current.length > 0) {
        setTimeout(waitForBuffer, 50)
      } else {
        if (mediaSource.readyState === 'open') {
          mediaSource.endOfStream()
        }
      }
    }
    waitForBuffer()

    // Start playing if we never did (short text)
    if (!hasStartedPlaying && chunkCount > 0) {
      audio.play().catch(console.error)
    }
  }, [appendNextChunk])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (mediaSourceRef.current?.readyState === 'open') {
      try { mediaSourceRef.current.endOfStream() } catch {}
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsPlaying(false)
  }, [])

  return { play, stop, isPlaying, alignment, currentTime }
}
