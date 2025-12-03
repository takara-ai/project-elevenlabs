import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const GamePhase = {
  IDLE: 'idle',
  INTRO_ACTION: 'intro',
  LOADING: 'loading',
  STORY: 'story',
  ACTION: 'action',
} as const

export type GamePhaseType = typeof GamePhase[keyof typeof GamePhase]

// Story entry - narrator text + available actions
export interface StoryEntry {
  type: 'story'
  id: string
  narrativeText: string
  actions: string[]
  timestamp: number
}

// Action entry - what the player did
export interface ActionEntry {
  type: 'action'
  id: string
  text: string
  isCustom: boolean
  timestamp: number
}

export type HistoryEntry = StoryEntry | ActionEntry

interface GameState {
  storyId: string | null
  phase: GamePhaseType
  cycleIndex: number
  currentStory: StoryEntry | null
  history: HistoryEntry[]
  loadingProgress: number
  error: string | null
}

interface GameActions {
  startGame: (storyId?: string) => void
  completeIntro: () => void
  setLoadingProgress: (progress: number) => void
  completeLoading: (narrativeText: string, actions: string[]) => void
  proceedToAction: () => void
  submitAction: (text: string, isCustom?: boolean) => void
  resetGame: () => void
  setError: (error: string | null) => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

const initialState: GameState = {
  storyId: null,
  phase: GamePhase.IDLE,
  cycleIndex: 0,
  currentStory: null,
  history: [],
  loadingProgress: 0,
  error: null,
}

export const useGameStore = create<GameState & GameActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      startGame: (storyId) => set({
        ...initialState,
        storyId: storyId || generateId(),
        phase: GamePhase.INTRO_ACTION,
      }, false, 'startGame'),

      completeIntro: () => set({
        phase: GamePhase.LOADING,
        loadingProgress: 0,
      }, false, 'completeIntro'),

      setLoadingProgress: (progress) => set({
        loadingProgress: Math.min(100, Math.max(0, progress))
      }, false, 'setLoadingProgress'),

      completeLoading: (narrativeText, actions) => {
        const story: StoryEntry = {
          type: 'story',
          id: generateId(),
          narrativeText,
          actions,
          timestamp: Date.now(),
        }
        set({
          phase: GamePhase.STORY,
          currentStory: story,
          history: [...get().history, story],
          loadingProgress: 100,
        }, false, 'completeLoading')
      },

      proceedToAction: () => set({ phase: GamePhase.ACTION }, false, 'proceedToAction'),

      submitAction: (text, isCustom = false) => {
        const action: ActionEntry = {
          type: 'action',
          id: generateId(),
          text,
          isCustom,
          timestamp: Date.now(),
        }
        set({
          phase: GamePhase.LOADING,
          cycleIndex: get().cycleIndex + 1,
          history: [...get().history, action],
          loadingProgress: 0,
          currentStory: null,
        }, false, 'submitAction')
      },

      resetGame: () => set(initialState, false, 'resetGame'),

      setError: (error) => set({ error }, false, 'setError'),
    }),
    { name: 'game-store' }
  )
)

// Selectors
export const selectIsPlaying = (state: GameState) => state.phase !== GamePhase.IDLE
export const selectIsLoading = (state: GameState) => state.phase === GamePhase.LOADING
export const selectCanAct = (state: GameState) => state.phase === GamePhase.ACTION
