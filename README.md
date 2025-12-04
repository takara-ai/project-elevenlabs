# Hanashi

![Hanashi cover](public/cover.png)

**Hanashi** (話 - "story" in Japanese) is an immersive storytelling game where you become the hero of an AI-generated narrative. Every choice you make shapes a unique story brought to life through fully AI-generated scenarios, voice narration, dynamic sound effects, and adaptive soundtracks.

## 🎯 Vision

The goal was to create a **super immersive experience** that combines cutting-edge AI technology with rich audio-visual storytelling. Every element of the game—from the narrative to the soundscape—is dynamically generated in real-time, creating a truly unique experience for each playthrough.

## ✨ Features

- **AI-Generated Narratives**: Stories dynamically created using Anthropic's Claude Sonnet 4, adapting to your choices
- **Immersive Voice Narration**: ElevenLabs text-to-speech with character-level timestamps for synchronized subtitles
- **Dynamic Sound Design**: AI-generated sound effects and ambient soundscapes that match the story setting
- **Adaptive Soundtrack**: Mood-based music that evolves with the narrative (calm, tense, danger, mystery, triumph)
- **3D Visual Experience**: Beautiful 3D scene rendered with React Three Fiber, featuring bloom effects, ordered dithering, and smooth camera movements
- **Interactive Storytelling**: Make bold choices that significantly impact the narrative direction
- **Real-time Generation**: All content generated on-demand with intelligent caching for performance

## 🛠️ Tech Stack

### AI & Audio Generation

- **[Anthropic Claude Sonnet 4](https://www.anthropic.com/)** - Story generation and narrative AI
- **[ElevenLabs](https://elevenlabs.io/)** - Text-to-speech, sound effects, and music generation
  - Voice narration with alignment timestamps
  - Action sound effects
  - Ambient soundscapes (soundstage)
  - Mood-based background music

### Frontend

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React Three Fiber](https://docs.pmnd.rs/react-three-fiber)** - 3D rendering with Three.js
- **[@react-three/postprocessing](https://github.com/pmndrs/postprocessing)** - Visual effects (bloom, tone mapping, dithering)
- **[Zustand](https://github.com/pmndrs/zustand)** - State management
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)** - Audio file caching

### Development Tools

- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Leva](https://github.com/pmndrs/leva)** - Debug controls (accessible via `?debug` query param)

## 🏗️ Architecture

### Story Generation Flow

1. **User Action** → Player selects an action choice
2. **Parallel Generation**:
   - Anthropic Claude generates narrative text, action choices, and mood
   - ElevenLabs generates action sound effect
3. **Sequential Generation**:
   - ElevenLabs generates narrator voice with timestamps
   - If mood changed, generate new mood music
4. **Rendering**: Story displayed with synchronized audio, subtitles, and visual effects

### Audio System

The game features a sophisticated multi-layer audio system:

- **Background Music**: Fades out when story begins
- **Soundstage**: Ambient loop matching the story setting (generated once per story)
- **Action Sounds**: Short sound effects for each action (generated per action)
- **Mood Music**: Progressive background music that crossfades when mood changes
- **Narrator Voice**: Delayed playback to let action sounds play first

### Caching Strategy

- **LLM Responses**: Cached by message history hash
- **TTS Audio**: Cached by text + voice ID
- **Sound Effects**: Cached by prompt in metadata
- **Mood Music**: Cached by setting + mood combination

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- API keys:
  - `ELEVENLABS_API_KEY` - ElevenLabs API key
  - `ANTHROPIC_API_KEY` - Anthropic API key (via Vercel AI SDK)

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Add your API keys to .env.local

# Run development server
bun dev
```

Visit `http://localhost:3000` to start playing.

### Environment Variables

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional: Disable features for testing
DISABLE_SOUND_EFFECTS=false
DISABLE_NARRATOR=false
```

## 🎮 How to Play

1. **Start**: Click anywhere on the splash screen to begin
2. **Choose Your Story**: Select a genre or setting to start your adventure
3. **Make Choices**: Click on action choices to progress the story
4. **Experience**: Immerse yourself in the AI-generated narrative, voice, and soundscape

### Debug Mode

Add `?debug` to the URL to access Leva controls for adjusting:

- Lighting parameters
- Bloom effects
- Character animations
- Scene elements

## 📁 Project Structure

```
app/
├── _scene/              # 3D scene components
│   ├── components/      # Scene elements (camera, character, floor, etc.)
│   └── store/          # Scene-specific state
├── api/action/         # Story generation API endpoint
├── game/               # Main game page
├── lib/
│   ├── cache/          # Caching utilities
│   ├── game/           # Game controller
│   ├── sound-effects/  # Sound generation logic
│   ├── speech/         # TTS and caption handling
│   ├── story-generation/ # AI story generation
│   └── state-management/ # Global game state
components/             # UI components
public/                 # Static assets
```

## 🎨 Visual Features

- **Bloom Effects**: Glowing post-processing for atmospheric visuals
- **Ordered Dithering**: Custom shader for stylized rendering
- **Smooth Camera**: Dynamic camera that follows story progression
- **3D Text**: Story history rendered as 3D text in the scene
- **Character Animation**: Animated character model with cursor following

## 🔧 Development

### Scripts

```bash
bun dev          # Start development server
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
bun tts          # Run TTS script (see scripts/tts.ts)
```

### Key Files

- `app/lib/game/controller.ts` - Main game logic
- `app/lib/story-generation/action-handler.ts` - Story generation orchestration
- `app/lib/speech/elevenlabs-tts.ts` - Voice synthesis
- `app/lib/sound-effects/generate.ts` - Sound effect generation
- `app/game/page.tsx` - Main game UI and audio management

## 🎭 Credits

Created by:

- **[Cody Adams](https://www.linkedin.com/in/codyadam/)**
- **[Jordan Legg](https://www.linkedin.com/in/404missinglink/)**

Built for **Project ElevenLabs** - showcasing the future of AI-powered interactive storytelling.

## 📝 License

Private project - All rights reserved.

---

_Experience stories like never before. Every choice matters. Every story is unique._
