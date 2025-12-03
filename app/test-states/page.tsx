'use client'

import { useState } from 'react'
import {
  useGameStore,
  GamePhase,
  ActionType,
  type StoryEntry,
  type ActionEntry,
  type HistoryEntry,
} from '@/app/lib/state-management/states'

// Mock story generator for testing
const generateMockStory = (cycleIndex: number): Omit<StoryEntry, 'type' | 'timestamp'> => ({
  id: `story-${cycleIndex}`,
  narrativeText: `This is the narrative for cycle ${cycleIndex}. The hero stands at a crossroads, uncertain of what lies ahead. The wind whispers secrets of ancient times...`,
  characterDialogues: [
    {
      characterId: 'guide',
      characterName: 'The Guide',
      text: `Welcome, traveler. This is your ${cycleIndex === 0 ? 'first' : `${cycleIndex + 1}th`} step on this journey.`,
    },
  ],
  pregeneratedActions: [
    { id: 'action-1', text: 'Go left into the dark forest' },
    { id: 'action-2', text: 'Go right toward the mountains' },
    { id: 'action-3', text: 'Stay and ask for more information' },
  ],
  soundEffects: [
    { id: 'wind', name: 'Wind Howling', timestamp: 0 },
    { id: 'footsteps', name: 'Footsteps', timestamp: 2000 },
  ],
  soundtrack: 'ambient-mystery-01',
})

export default function TestStatesPage() {
  const store = useGameStore()
  const [customActionText, setCustomActionText] = useState('')
  const [loadingSimulation, setLoadingSimulation] = useState(false)

  // Simulate loading with progress
  const simulateLoading = async () => {
    setLoadingSimulation(true)
    for (let i = 0; i <= 100; i += 10) {
      store.setLoadingProgress(i)
      await new Promise((r) => setTimeout(r, 100))
    }
    store.completeLoading(generateMockStory(store.cycleIndex))
    setLoadingSimulation(false)
  }

  // Get phase color for visual feedback
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case GamePhase.IDLE: return 'bg-zinc-800'
      case GamePhase.INTRO_ACTION: return 'bg-amber-900'
      case GamePhase.LOADING: return 'bg-blue-900'
      case GamePhase.STORY: return 'bg-emerald-900'
      case GamePhase.ACTION: return 'bg-purple-900'
      default: return 'bg-zinc-800'
    }
  }

  const renderHistoryEntry = (entry: HistoryEntry, index: number) => {
    if (entry.type === 'story') {
      const story = entry as StoryEntry
      return (
        <div key={entry.id} className="border border-emerald-700 rounded p-3 bg-emerald-950/30">
          <div className="text-xs text-emerald-400 mb-1">STORY #{index + 1}</div>
          <p className="text-sm text-zinc-300 mb-2">{story.narrativeText.slice(0, 80)}...</p>
          <div className="flex gap-2 text-xs text-zinc-500">
            <span>{story.pregeneratedActions.length} actions</span>
            <span>{story.soundEffects.length} sfx</span>
            {story.soundtrack && <span>music: {story.soundtrack}</span>}
          </div>
        </div>
      )
    } else {
      const action = entry as ActionEntry
      return (
        <div key={entry.id} className="border border-purple-700 rounded p-3 bg-purple-950/30">
          <div className="text-xs text-purple-400 mb-1">
            ACTION #{index + 1} ({action.actionType})
          </div>
          <p className="text-sm text-zinc-300">{action.text}</p>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">State Management Test</h1>
          <p className="text-zinc-500 mt-1">Play through the game loop manually</p>
        </div>

        {/* Current State Display */}
        <div className={`rounded-lg p-6 transition-colors ${getPhaseColor(store.phase)}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-zinc-400 uppercase">Phase</div>
              <div className="text-xl font-mono font-bold">{store.phase}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400 uppercase">Cycle</div>
              <div className="text-xl font-mono font-bold">{store.cycleIndex}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400 uppercase">Story ID</div>
              <div className="text-xl font-mono font-bold">{store.storyId?.slice(0, 8) || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400 uppercase">History</div>
              <div className="text-xl font-mono font-bold">{store.history.length}</div>
            </div>
          </div>

          {store.phase === GamePhase.LOADING && (
            <div className="mt-4">
              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-100"
                  style={{ width: `${store.loadingProgress}%` }}
                />
              </div>
              <div className="text-center text-sm text-zinc-400 mt-1">{store.loadingProgress}%</div>
            </div>
          )}
        </div>

        {/* Phase Flow Diagram */}
        <div className="flex items-center justify-center gap-2 text-xs">
          {Object.values(GamePhase).map((phase, i) => (
            <div key={phase} className="flex items-center gap-2">
              <div
                className={`px-3 py-1 rounded ${
                  store.phase === phase
                    ? 'bg-white text-black font-bold'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {phase}
              </div>
              {i < Object.values(GamePhase).length - 1 && (
                <span className="text-zinc-600">-&gt;</span>
              )}
            </div>
          ))}
          <span className="text-zinc-600">-&gt; (loop to loading)</span>
        </div>

        {/* Actions Panel */}
        <div className="border border-zinc-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Actions</h2>

          {/* IDLE State */}
          {store.phase === GamePhase.IDLE && (
            <button
              onClick={() => store.startGame()}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded font-medium transition-colors"
            >
              Start Game
            </button>
          )}

          {/* INTRO State */}
          {store.phase === GamePhase.INTRO_ACTION && (
            <button
              onClick={() => store.completeIntro()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded font-medium transition-colors"
            >
              Complete Intro -&gt; Start Loading
            </button>
          )}

          {/* LOADING State */}
          {store.phase === GamePhase.LOADING && (
            <div className="space-y-2">
              <button
                onClick={simulateLoading}
                disabled={loadingSimulation}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 rounded font-medium transition-colors"
              >
                {loadingSimulation ? 'Simulating...' : 'Simulate Loading -&gt; Show Story'}
              </button>
              <button
                onClick={() => store.setLoadingProgress(store.loadingProgress + 20)}
                disabled={loadingSimulation}
                className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded text-sm transition-colors"
              >
                +20% Progress
              </button>
            </div>
          )}

          {/* STORY State */}
          {store.phase === GamePhase.STORY && (
            <div className="space-y-4">
              {store.currentStory && (
                <div className="bg-zinc-900 rounded p-4 space-y-3">
                  <div className="text-sm text-zinc-400">Current Story:</div>
                  <p className="text-zinc-200">{store.currentStory.narrativeText}</p>
                  {store.currentStory.characterDialogues?.map((d) => (
                    <div key={d.characterId} className="border-l-2 border-amber-500 pl-3">
                      <div className="text-amber-400 text-sm font-medium">{d.characterName}</div>
                      <div className="text-zinc-300">&quot;{d.text}&quot;</div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => store.proceedToAction()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded font-medium transition-colors"
              >
                Proceed to Action
              </button>
            </div>
          )}

          {/* ACTION State */}
          {store.phase === GamePhase.ACTION && store.currentStory && (
            <div className="space-y-4">
              <div className="text-sm text-zinc-400">Choose a pregenerated action:</div>
              <div className="space-y-2">
                {store.currentStory.pregeneratedActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => store.submitPregeneratedAction(action.id, action.text)}
                    className="w-full py-2 px-4 bg-zinc-800 hover:bg-purple-800 rounded text-left transition-colors"
                  >
                    {action.text}
                  </button>
                ))}
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <div className="text-sm text-zinc-400 mb-2">Or enter a custom action:</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customActionText}
                    onChange={(e) => setCustomActionText(e.target.value)}
                    placeholder="Type your custom action..."
                    className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => {
                      if (customActionText.trim()) {
                        store.submitCustomAction(customActionText.trim())
                        setCustomActionText('')
                      }
                    }}
                    disabled={!customActionText.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 rounded font-medium transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reset Button (always visible except in IDLE) */}
          {store.phase !== GamePhase.IDLE && (
            <button
              onClick={() => store.resetGame()}
              className="w-full py-2 bg-red-900 hover:bg-red-800 rounded text-sm transition-colors mt-4"
            >
              Reset Game
            </button>
          )}
        </div>

        {/* History Panel */}
        {store.history.length > 0 && (
          <div className="border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">History ({store.history.length} entries)</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {store.history.map((entry, i) => renderHistoryEntry(entry, i))}
            </div>
          </div>
        )}

        {/* Raw State Debug */}
        <details className="border border-zinc-800 rounded-lg">
          <summary className="p-4 cursor-pointer text-zinc-500 hover:text-zinc-300">
            Raw State (Debug)
          </summary>
          <pre className="p-4 pt-0 text-xs text-zinc-400 overflow-auto">
            {JSON.stringify(
              {
                storyId: store.storyId,
                phase: store.phase,
                cycleIndex: store.cycleIndex,
                loadingProgress: store.loadingProgress,
                currentStory: store.currentStory,
                history: store.history,
                error: store.error,
              },
              null,
              2
            )}
          </pre>
        </details>
      </div>
    </div>
  )
}

