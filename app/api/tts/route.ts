import { NextRequest } from 'next/server'

const API_KEY = process.env.ELEVENLABS_API_KEY!

export async function POST(req: NextRequest) {
  const { text, voiceId = 'AeRdCCKzvd23BpJoofzx' } = await req.json()

  // Use stream with timestamps for alignment data (captions)
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream/with-timestamps?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': API_KEY },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  )

  if (!response.ok) {
    return new Response(await response.text(), { status: response.status })
  }

  // Stream NDJSON directly to client
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
