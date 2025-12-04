"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState, useCallback } from "react";
import { Prompt, SplashContainer, Title } from "../../components/splash";
import { Scene } from "../_scene/scene";
import { useGameStore, GamePhase } from "../lib/state-management/states";
import { useStreamingAudio } from "../lib/speech/use-streaming-audio";

const FADE_DURATION_MS = 2000;
const FADE_INTERVAL_MS = 50;

interface SubtitleLine {
  text: string;
  id: number;
  fading: boolean;
}

function findSentenceEnd(text: string): number {
  const endings = ['. ', '! ', '? ', '."', '!"', '?"'];
  let lastEnd = -1;
  for (const ending of endings) {
    const idx = text.lastIndexOf(ending);
    if (idx > lastEnd) lastEnd = idx + ending.length - 1;
  }
  if (text.endsWith('.') || text.endsWith('!') || text.endsWith('?')) return text.length;
  return lastEnd;
}

function Subtitles({ text }: { text: string }) {
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const lineIdRef = useRef(0);
  const prevTextRef = useRef('');

  useEffect(() => {
    if (text.length < prevTextRef.current.length) {
      setLines([]);
      lineIdRef.current = 0;
      prevTextRef.current = text;
      return;
    }

    const newText = text.slice(prevTextRef.current.length);
    prevTextRef.current = text;
    if (!newText) return;

    setLines(prev => {
      const activeIdx = prev.findIndex(l => !l.fading);
      const activeLine = activeIdx >= 0 ? prev[activeIdx] : null;
      const combined = (activeLine?.text || '') + newText;
      const sentenceEnd = findSentenceEnd(combined);

      if (sentenceEnd > 0 && sentenceEnd < combined.length) {
        const completedText = combined.slice(0, sentenceEnd).trim();
        const remainder = combined.slice(sentenceEnd).trim();
        const newLines: SubtitleLine[] = [];
        const fadingLines = prev.filter(l => l.fading);
        if (fadingLines.length > 0) newLines.push(fadingLines[fadingLines.length - 1]);
        newLines.push({ text: completedText, id: activeLine?.id ?? lineIdRef.current++, fading: true });
        if (remainder) newLines.push({ text: remainder, id: lineIdRef.current++, fading: false });
        return newLines.slice(-2);
      } else {
        if (activeLine) {
          return prev.map(l => l.id === activeLine.id ? { ...l, text: combined } : l);
        }
        return [...prev, { text: combined, id: lineIdRef.current++, fading: false }].slice(-2);
      }
    });
  }, [text]);

  if (lines.length === 0) return null;

  return (
    <div className="absolute bottom-20 left-0 right-0 flex flex-col pointer-events-none z-40 gap-2">
      {lines.map(line => (
        <div key={line.id} className={`transition-opacity duration-500 ease-out ${line.fading ? 'opacity-50' : 'opacity-100'}`}>
          <p className="text-white text-xl font-medium tracking-wide leading-relaxed px-8 py-4 rounded-lg max-w-3xl"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {line.text}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const phase = useGameStore((s) => s.phase);
  const soundstageUrl = useGameStore((s) => s.soundstageUrl);
  const actionSoundUrl = useGameStore((s) => s.actionSoundUrl);
  const currentStory = useGameStore((s) => s.currentStory);

  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [bgMusicFadingOut, setBgMusicFadingOut] = useState(false);
  const [soundstagePlaying, setSoundstagePlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const soundstageRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedActionSoundRef = useRef<string | null>(null);
  const lastPlayedStoryIdRef = useRef<string | null>(null);

  // Streaming TTS with progressive captions
  const { play: playTTS, alignment, currentTime: ttsCurrentTime } = useStreamingAudio();

  // Sync captions with alignment data
  const [captionText, setCaptionText] = useState('');

  useEffect(() => {
    if (!alignment) {
      setCaptionText('');
      return;
    }
    const { characters, character_end_times_seconds } = alignment;
    let charIndex = -1;
    for (let i = 0; i < character_end_times_seconds.length; i++) {
      if (character_end_times_seconds[i] <= ttsCurrentTime) charIndex = i;
      else break;
    }
    setCaptionText(characters.slice(0, charIndex + 1).join(''));
  }, [alignment, ttsCurrentTime]);

  // Stream TTS when new story arrives
  useEffect(() => {
    if (currentStory && currentStory.id !== lastPlayedStoryIdRef.current) {
      lastPlayedStoryIdRef.current = currentStory.id;
      setCaptionText('');
      playTTS(currentStory.narrativeText).catch(console.error);
    }
  }, [currentStory, playTTS]);

  const fadeOutBackgroundMusic = useCallback(() => {
    if (!audioRef.current || bgMusicFadingOut) return;
    setBgMusicFadingOut(true);
    const audio = audioRef.current;
    const startVolume = audio.volume;
    const steps = FADE_DURATION_MS / FADE_INTERVAL_MS;
    const volumeStep = startVolume / steps;

    fadeIntervalRef.current = setInterval(() => {
      if (audio.volume > volumeStep) {
        audio.volume = Math.max(0, audio.volume - volumeStep);
      } else {
        audio.volume = 0;
        audio.pause();
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      }
    }, FADE_INTERVAL_MS);
  }, [bgMusicFadingOut]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().then(() => setAudioPlaying(true)).catch(() => setAudioPlaying(false));
    }
  }, []);

  useEffect(() => {
    if (phase === GamePhase.STORY && !bgMusicFadingOut) fadeOutBackgroundMusic();

    if (phase === GamePhase.STORY && soundstageUrl && !soundstagePlaying) {
      const audio = new Audio(soundstageUrl);
      audio.loop = true;
      audio.volume = 0;
      soundstageRef.current = audio;

      audio.play().then(() => {
        setSoundstagePlaying(true);
        const fadeIn = setInterval(() => {
          if (audio.volume < 0.25) audio.volume = Math.min(0.25, audio.volume + 0.01);
          else clearInterval(fadeIn);
        }, FADE_INTERVAL_MS);
      }).catch(console.error);
    }

    if (phase === GamePhase.IDLE && soundstageRef.current) {
      soundstageRef.current.pause();
      soundstageRef.current = null;
      setSoundstagePlaying(false);
    }
  }, [phase, soundstageUrl, soundstagePlaying, bgMusicFadingOut, fadeOutBackgroundMusic]);

  useEffect(() => {
    if (actionSoundUrl && actionSoundUrl !== lastPlayedActionSoundRef.current) {
      lastPlayedActionSoundRef.current = actionSoundUrl;
      const audio = new Audio(actionSoundUrl);
      audio.volume = 0.45;
      audio.play().catch(console.error);
    }
  }, [actionSoundUrl]);

  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (soundstageRef.current) {
        soundstageRef.current.pause();
        soundstageRef.current = null;
      }
    };
  }, []);

  const handleDismissSplash = () => {
    if (splashFading) return;
    if (audioRef.current && !audioPlaying) {
      audioRef.current.play().then(() => setAudioPlaying(true)).catch(() => { });
    }
    setSplashFading(true);
    setTimeout(() => {
      setShowSplash(false);
      setCanvasVisible(true);
    }, 700);
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <audio ref={audioRef} src="/audio/background.mp3" loop />

      <div className={`h-full w-full transition-opacity duration-700 ease-out ${canvasVisible ? "opacity-100" : "opacity-0"}`}>
        <Canvas className="h-full w-full">
          <color attach="background" args={["#000000"]} />
          <Scene />
        </Canvas>
      </div>

      {phase === GamePhase.STORY && <Subtitles text={captionText} />}

      {showSplash && (
        <SplashContainer onClick={handleDismissSplash} fading={splashFading}>
          <div className="relative z-10 flex flex-col items-center gap-12">
            <Title />
            <Prompt>{audioPlaying ? "Click anywhere to begin" : "Click to enable audio"}</Prompt>
          </div>
        </SplashContainer>
      )}
    </div>
  );
}
