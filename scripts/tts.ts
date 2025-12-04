#!/usr/bin/env bun

import { writeFile } from 'fs/promises'
import { resolve } from 'path'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const DEFAULT_VOICE_ID = 'AeRdCCKzvd23BpJoofzx'

interface TTSOptions {
  text: string
  voiceId?: string
  output?: string
}

async function generateSpeech({ text, voiceId = DEFAULT_VOICE_ID, output }: TTSOptions) {
  if (!ELEVENLABS_API_KEY) {
    console.error('Error: ELEVENLABS_API_KEY environment variable is not set')
    process.exit(1)
  }

  if (!text) {
    console.error('Error: No text provided')
    process.exit(1)
  }

  console.log(`Generating speech for: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`)
  console.log(`Voice ID: ${voiceId}`)

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
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
    console.error(`ElevenLabs API error: ${response.status} - ${errorText}`)
    process.exit(1)
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer())
  const outputPath = resolve(output || `output-${Date.now()}.mp3`)
  
  await writeFile(outputPath, audioBuffer)
  console.log(`Audio saved to: ${outputPath}`)
}

// Parse CLI arguments
const args = process.argv.slice(2)

function printHelp() {
  console.log(`
ElevenLabs TTS CLI

Usage:
  bun scripts/tts.ts --text "Your text here" [options]

Options:
  --text, -t     Text to convert to speech (required)
  --voice, -v    Voice ID (default: ${DEFAULT_VOICE_ID})
  --output, -o   Output file path (default: output-<timestamp>.mp3)
  --help, -h     Show this help message

Examples:
  bun scripts/tts.ts --text "Hello, world!"
  bun scripts/tts.ts -t "Hello" -o greeting.mp3
  bun scripts/tts.ts --text "Custom voice" --voice abc123
`)
}

function parseArgs(args: string[]): TTSOptions {
  const options: TTSOptions = { text: '' }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const nextArg = args[i + 1]

    switch (arg) {
      case '--text':
      case '-t':
        options.text = nextArg || ''
        i++
        break
      case '--voice':
      case '-v':
        options.voiceId = nextArg
        i++
        break
      case '--output':
      case '-o':
        options.output = nextArg
        i++
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
    }
  }

  return options
}

const options = parseArgs(args)

if (!options.text) {
  console.error('Error: --text is required\n')
  printHelp()
  process.exit(1)
}

generateSpeech(options)

