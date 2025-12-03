"use client";

import { useEffect, useRef, useState } from "react";
import { game } from "../lib/game/controller";
import {
  useGameStore,
  selectCanStart,
  GamePhase,
  HistoryEntry,
  StoryEntry,
  ActionEntry,
} from "../lib/state-management/states";
import { STARTER_STORIES } from "../lib/story-generation/data";

export default function TestStatesPage() {
  // Primitives - safe to select directly
  const phase = useGameStore((s) => s.phase);
  const cycleIndex = useGameStore((s) => s.cycleIndex);
  const sessionId = useGameStore((s) => s.sessionId);
  const loadingProgress = useGameStore((s) => s.loadingProgress);
  const error = useGameStore((s) => s.error);
  const isGenerating = useGameStore((s) => s.isGenerating);
  const pendingStarter = useGameStore((s) => s.pendingStarter);
  const pendingCustomSetting = useGameStore((s) => s.pendingCustomSetting);
  const customActionInput = useGameStore((s) => s.customActionInput);
  const canStart = useGameStore(selectCanStart);
  const soundstageUrl = useGameStore((s) => s.soundstageUrl);
  const soundstageLoading = useGameStore((s) => s.soundstageLoading);

  // Objects - select the reference, access properties in render
  const currentStory = useGameStore((s) => s.currentStory);
  const history = useGameStore((s) => s.history);

  // Actions
  const setStarter = useGameStore((s) => s.setStarter);
  const setCustomSetting = useGameStore((s) => s.setCustomSetting);
  const setCustomActionInput = useGameStore((s) => s.setCustomActionInput);

  // Soundstage audio
  const soundstageRef = useRef<HTMLAudioElement | null>(null);
  const [soundstagePlaying, setSoundstagePlaying] = useState(false);

  // Play soundstage when story starts and URL is available
  useEffect(() => {
    if (phase === GamePhase.STORY && soundstageUrl && !soundstagePlaying) {
      const audio = new Audio(soundstageUrl);
      audio.loop = true;
      audio.volume = 0.25;
      soundstageRef.current = audio;
      audio
        .play()
        .then(() => setSoundstagePlaying(true))
        .catch(console.error);
    }

    // Stop soundstage when returning to idle
    if (phase === GamePhase.IDLE && soundstageRef.current) {
      soundstageRef.current.pause();
      soundstageRef.current = null;
      setSoundstagePlaying(false);
    }
  }, [phase, soundstageUrl, soundstagePlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundstageRef.current) {
        soundstageRef.current.pause();
        soundstageRef.current = null;
      }
    };
  }, []);

  const phaseColor = {
    [GamePhase.IDLE]: "bg-zinc-800",
    [GamePhase.INTRO]: "bg-amber-900",
    [GamePhase.LOADING]: "bg-blue-900",
    [GamePhase.STORY]: "bg-emerald-900",
    [GamePhase.ACTION]: "bg-purple-900",
  }[phase];

  const renderEntry = (entry: HistoryEntry, i: number) => {
    if (entry.type === "story") {
      return (
        <div
          key={entry.id}
          className="border border-emerald-700 rounded p-3 bg-emerald-950/30"
        >
          <div className="text-xs text-emerald-400 mb-1">STORY #{i + 1}</div>
          <p className="text-sm text-zinc-300">
            {(entry as StoryEntry).narrativeText.slice(0, 100)}...
          </p>
        </div>
      );
    }
    return (
      <div
        key={entry.id}
        className="border border-purple-700 rounded p-3 bg-purple-950/30"
      >
        <div className="text-xs text-purple-400 mb-1">
          ACTION #{i + 1} {(entry as ActionEntry).isCustom && "(custom)"}
        </div>
        <p className="text-sm text-zinc-300">{(entry as ActionEntry).text}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Game Controller Test
          </h1>
          <p className="text-zinc-500 mt-1">All state via Zustand</p>
        </div>

        <div className={`rounded-lg p-6 transition-colors ${phaseColor}`}>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-xs text-zinc-400">Phase</div>
              <div className="text-xl font-mono font-bold">{phase}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Cycle</div>
              <div className="text-xl font-mono font-bold">{cycleIndex}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Session</div>
              <div className="text-xl font-mono font-bold">
                {sessionId?.slice(0, 8) || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">History</div>
              <div className="text-xl font-mono font-bold">{history.length}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Soundstage</div>
              <div className="text-xl font-mono font-bold">
                {soundstageLoading
                  ? "..."
                  : soundstagePlaying
                    ? "ON"
                    : soundstageUrl
                      ? "READY"
                      : "-"}
              </div>
            </div>
          </div>
          {phase === GamePhase.LOADING && (
            <div className="mt-4 h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          )}
          {error && (
            <div className="mt-4 text-red-400 text-sm bg-red-950/50 p-2 rounded">
              {error}
            </div>
          )}
          {soundstagePlaying && (
            <div className="mt-4 flex items-center gap-4 bg-zinc-900/50 rounded p-3">
              <span className="text-xs text-zinc-400">Ambient</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                defaultValue="0.25"
                onChange={(e) => {
                  if (soundstageRef.current) {
                    soundstageRef.current.volume = parseFloat(e.target.value);
                  }
                }}
                className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <button
                onClick={() => {
                  if (soundstageRef.current) {
                    soundstageRef.current.muted = !soundstageRef.current.muted;
                  }
                }}
                className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded"
              >
                Mute
              </button>
            </div>
          )}
        </div>

        <div className="border border-zinc-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Controls</h2>

          {/* IDLE - Select story */}
          {phase === GamePhase.IDLE && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {STARTER_STORIES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStarter(s.id)}
                    className={`p-4 rounded-lg text-left border ${pendingStarter === s.id
                        ? "border-amber-500 bg-amber-950/50"
                        : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                      }`}
                  >
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-sm text-zinc-400">{s.description}</div>
                  </button>
                ))}
              </div>
              {pendingStarter === "custom" && (
                <textarea
                  value={pendingCustomSetting}
                  onChange={(e) => setCustomSetting(e.target.value)}
                  placeholder="Describe your story setting..."
                  className="w-full h-24 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded resize-none focus:outline-none focus:border-amber-500"
                />
              )}
              <button
                onClick={() => game.start()}
                disabled={!canStart || isGenerating}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 rounded font-medium"
              >
                {isGenerating ? "Starting..." : "game.start()"}
              </button>
            </div>
          )}

          {/* STORY - Read and proceed */}
          {phase === GamePhase.STORY && currentStory && (
            <div className="space-y-4">
              <div className="bg-zinc-900 rounded p-4">
                <p className="text-zinc-200 whitespace-pre-wrap">
                  {currentStory.narrativeText}
                </p>
                {currentStory.audioBase64 && (
                  <audio
                    autoPlay
                    controls
                    className="w-full mt-4"
                    src={`data:audio/mpeg;base64,${currentStory.audioBase64}`}
                  />
                )}
              </div>
              <button
                onClick={() => game.ready()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded font-medium"
              >
                game.ready()
              </button>
            </div>
          )}

          {/* ACTION - Choose or custom */}
          {phase === GamePhase.ACTION && currentStory && (
            <div className="space-y-4">
              <div className="space-y-2">
                {currentStory.actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => game.act(action)}
                    disabled={isGenerating}
                    className="w-full py-2 px-4 bg-zinc-800 hover:bg-purple-800 disabled:opacity-50 rounded text-left"
                  >
                    {action}
                  </button>
                ))}
              </div>
              <div className="border-t border-zinc-800 pt-4 flex gap-2">
                <input
                  value={customActionInput}
                  onChange={(e) => setCustomActionInput(e.target.value)}
                  placeholder="Custom action..."
                  className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => game.actCustom()}
                  disabled={!customActionInput.trim() || isGenerating}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 rounded font-medium"
                >
                  game.actCustom()
                </button>
              </div>
            </div>
          )}

          {/* LOADING */}
          {phase === GamePhase.LOADING && (
            <div className="text-center text-zinc-400 py-4">Generating...</div>
          )}

          {/* Reset */}
          {phase !== GamePhase.IDLE && (
            <button
              onClick={() => game.reset()}
              className="w-full py-2 bg-red-900 hover:bg-red-800 rounded text-sm mt-4"
            >
              game.reset()
            </button>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">History</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map(renderEntry)}
            </div>
          </div>
        )}

        {/* Debug */}
        <details className="border border-zinc-800 rounded-lg">
          <summary className="p-4 cursor-pointer text-zinc-500 hover:text-zinc-300">
            Raw State
          </summary>
          <pre className="p-4 pt-0 text-xs text-zinc-400 overflow-auto">
            {JSON.stringify(
              {
                sessionId,
                phase,
                cycleIndex,
                pendingStarter,
                currentStory,
                history,
                isGenerating,
                error,
                soundstageUrl,
                soundstageLoading,
                soundstagePlaying,
              },
              null,
              2
            )}
          </pre>
        </details>
      </div>
    </div>
  );
}
