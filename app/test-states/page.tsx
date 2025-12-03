'use client'

import { useState } from 'react'
import {
  useGameStore,
  GamePhase,
  type StoryEntry,
  type ActionEntry,
  type HistoryEntry,
} from '@/app/lib/state-management/states'
import { STARTER_STORIES } from '@/app/lib/story-generation/data'
import { generateStoryScenario } from '@/app/lib/story-generation/generate'

export default function TestStatesPage() {
  const store = useGameStore()
  const [customActionText, setCustomActionText] = useState('')
  const [customSetting, setCustomSetting] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedStarter, setSelectedStarter] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canBegin = selectedStarter && (selectedStarter !== 'custom' || customSetting.trim())

  const runGeneration = async () => {
    if (!selectedStarter) return
    setLoading(true)
    setError(null)
    store.setLoadingProgress(30)

    try {
      const history = store.history.map(h => ({
        text: h.type === 'story' ? (h as StoryEntry).narrativeText : (h as ActionEntry).text,
        type: h.type,
      }))
      store.setLoadingProgress(60)
      const { narrativeText, actions } = await generateStoryScenario(
        selectedStarter,
        history,
        store.cycleIndex,
        selectedStarter === 'custom' ? customSetting : undefined
      )
      store.completeLoading(narrativeText, actions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const phaseColor = {
    [GamePhase.IDLE]: 'bg-zinc-800',
    [GamePhase.INTRO_ACTION]: 'bg-amber-900',
    [GamePhase.LOADING]: 'bg-blue-900',
    [GamePhase.STORY]: 'bg-emerald-900',
    [GamePhase.ACTION]: 'bg-purple-900',
  }[store.phase]

  const renderEntry = (entry: HistoryEntry, i: number) => {
    if (entry.type === 'story') {
      return (
        <div key={entry.id} className="border border-emerald-700 rounded p-3 bg-emerald-950/30">
          <div className="text-xs text-emerald-400 mb-1">STORY #{i + 1}</div>
          <p className="text-sm text-zinc-300">{(entry as StoryEntry).narrativeText.slice(0, 100)}...</p>
        </div>
      )
    }
    return (
      <div key={entry.id} className="border border-purple-700 rounded p-3 bg-purple-950/30">
        <div className="text-xs text-purple-400 mb-1">ACTION #{i + 1} {(entry as ActionEntry).isCustom && '(custom)'}</div>
        <p className="text-sm text-zinc-300">{(entry as ActionEntry).text}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">State Management Test</h1>
          <p className="text-zinc-500 mt-1">Play through the game loop</p>
        </div>

        <div className={`rounded-lg p-6 transition-colors ${phaseColor}`}>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div><div className="text-xs text-zinc-400">Phase</div><div className="text-xl font-mono font-bold">{store.phase}</div></div>
            <div><div className="text-xs text-zinc-400">Cycle</div><div className="text-xl font-mono font-bold">{store.cycleIndex}</div></div>
            <div><div className="text-xs text-zinc-400">ID</div><div className="text-xl font-mono font-bold">{store.storyId?.slice(0, 8) || '-'}</div></div>
            <div><div className="text-xs text-zinc-400">History</div><div className="text-xl font-mono font-bold">{store.history.length}</div></div>
          </div>
          {store.phase === GamePhase.LOADING && (
            <div className="mt-4 h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${store.loadingProgress}%` }} />
            </div>
          )}
        </div>

        <div className="border border-zinc-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Actions</h2>

          {store.phase === GamePhase.IDLE && (
            <button onClick={() => store.startGame()} className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded font-medium">
              Start Game
            </button>
          )}

          {store.phase === GamePhase.INTRO_ACTION && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {STARTER_STORIES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStarter(s.id)}
                    className={`p-4 rounded-lg text-left border ${selectedStarter === s.id ? 'border-amber-500 bg-amber-950/50' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'}`}
                  >
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-sm text-zinc-400">{s.description}</div>
                  </button>
                ))}
              </div>
              {selectedStarter === 'custom' && (
                <textarea
                  value={customSetting}
                  onChange={(e) => setCustomSetting(e.target.value)}
                  placeholder="Describe your story setting... (e.g., 'A medieval kingdom where magic is forbidden. You are a secret mage.')"
                  className="w-full h-24 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded resize-none focus:outline-none focus:border-amber-500"
                />
              )}
              <button onClick={() => store.completeIntro()} disabled={!canBegin} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 rounded font-medium">
                Begin Adventure
              </button>
            </div>
          )}

          {store.phase === GamePhase.LOADING && (
            <div className="space-y-2">
              <button onClick={runGeneration} disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 rounded font-medium">
                {loading ? 'Generating...' : 'Generate Scene'}
              </button>
              {error && <div className="text-red-400 text-sm bg-red-950/50 p-2 rounded">{error}</div>}
            </div>
          )}

          {store.phase === GamePhase.STORY && store.currentStory && (
            <div className="space-y-4">
              <div className="bg-zinc-900 rounded p-4">
                <p className="text-zinc-200">{store.currentStory.narrativeText}</p>
              </div>
              <button onClick={() => store.proceedToAction()} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded font-medium">
                Proceed to Action
              </button>
            </div>
          )}

          {store.phase === GamePhase.ACTION && store.currentStory && (
            <div className="space-y-4">
              <div className="space-y-2">
                {store.currentStory.actions.map((action, i) => (
                  <button key={i} onClick={() => store.submitAction(action)} className="w-full py-2 px-4 bg-zinc-800 hover:bg-purple-800 rounded text-left">
                    {action}
                  </button>
                ))}
              </div>
              <div className="border-t border-zinc-800 pt-4 flex gap-2">
                <input
                  value={customActionText}
                  onChange={(e) => setCustomActionText(e.target.value)}
                  placeholder="Custom action..."
                  className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => { store.submitAction(customActionText.trim(), true); setCustomActionText('') }}
                  disabled={!customActionText.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 rounded font-medium"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {store.phase !== GamePhase.IDLE && (
            <button onClick={() => { store.resetGame(); setSelectedStarter(null); setCustomSetting(''); setError(null) }} className="w-full py-2 bg-red-900 hover:bg-red-800 rounded text-sm mt-4">
              Reset
            </button>
          )}
        </div>

        {store.history.length > 0 && (
          <div className="border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">History</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">{store.history.map(renderEntry)}</div>
          </div>
        )}

        <details className="border border-zinc-800 rounded-lg">
          <summary className="p-4 cursor-pointer text-zinc-500 hover:text-zinc-300">Raw State</summary>
          <pre className="p-4 pt-0 text-xs text-zinc-400 overflow-auto">{JSON.stringify(store, null, 2)}</pre>
        </details>
      </div>
    </div>
  )
}
