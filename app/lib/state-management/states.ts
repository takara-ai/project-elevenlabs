import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Game phases in order
export const GamePhase = {
  IDLE: 'idle',           // Before game starts
  INTRO_ACTION: 'intro',  // Initial intro action
  LOADING: 'loading',     // Loading next content
  STORY: 'story',         // Displaying story
  ACTION: 'action',       // Player action/choice
} as const

export type GamePhaseType = typeof GamePhase[keyof typeof GamePhase]

// Action types to distinguish pregenerated vs custom
export const ActionType = {
  PREGENERATED: 'pregenerated',
  CUSTOM: 'custom',
} as const

export type ActionTypeValue = typeof ActionType[keyof typeof ActionType]

// Character dialogue within a story
export interface CharacterDialogue {
  characterId: string
  characterName: string
  text: string
}

// Sound effect reference
export interface SoundEffect {
  id: string
  name: string
  timestamp?: number  // When in the narrative to play
  url?: string
}

// Pregenerated action option
export interface PregeneratedAction {
  id: string
  text: string
}

// Story entry in history
export interface StoryEntry {
  type: 'story'
  id: string
  narrativeText: string                    // Main narrator text
  characterDialogues?: CharacterDialogue[] // Characters speaking
  pregeneratedActions: PregeneratedAction[] // Available choices
  soundEffects: SoundEffect[]              // Sound effects
  soundtrack?: string                       // Background music ID/URL
  timestamp: number
}

// Action entry in history
export interface ActionEntry {
  type: 'action'
  id: string
  text: string                             // What the player said/did
  actionType: ActionTypeValue              // Pregenerated or custom
  pregeneratedActionId?: string            // If pregenerated, which one
  timestamp: number
}

// Union type for history entries
export type HistoryEntry = StoryEntry | ActionEntry

interface GameState {
  // Unique story session ID
  storyId: string | null
  
  // Current game phase
  phase: GamePhaseType
  
  // Which cycle of the loop we're on (starts at 0)
  cycleIndex: number
  
  // Current story being displayed
  currentStory: StoryEntry | null
  
  // Full history of story and action entries
  history: HistoryEntry[]
  
  // Loading progress (0-100)
  loadingProgress: number
  
  // Error state if something goes wrong
  error: string | null
}

interface GameActions {
  // Start the game (goes to intro)
  startGame: (storyId?: string) => void
  
  // Complete intro and begin the loop
  completeIntro: () => void
  
  // Set loading progress
  setLoadingProgress: (progress: number) => void
  
  // Complete loading, transition to story
  completeLoading: (story: Omit<StoryEntry, 'type' | 'timestamp'>) => void
  
  // Complete story reading, transition to action
  proceedToAction: () => void
  
  // Submit pregenerated action
  submitPregeneratedAction: (actionId: string, actionText: string) => void
  
  // Submit custom action
  submitCustomAction: (text: string) => void
  
  // Reset to initial state
  resetGame: () => void
  
  // Set error
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

      startGame: (storyId) => {
        set({ 
          ...initialState,
          storyId: storyId || generateId(),
          phase: GamePhase.INTRO_ACTION,
          error: null,
        }, false, 'startGame')
      },

      completeIntro: () => {
        set({ 
          phase: GamePhase.LOADING,
          loadingProgress: 0,
        }, false, 'completeIntro')
      },

      setLoadingProgress: (progress) => {
        set({ loadingProgress: Math.min(100, Math.max(0, progress)) }, false, 'setLoadingProgress')
      },

      completeLoading: (storyData) => {
        const story: StoryEntry = {
          ...storyData,
          type: 'story',
          timestamp: Date.now(),
        }
        const { history } = get()
        set({
          phase: GamePhase.STORY,
          currentStory: story,
          history: [...history, story],
          loadingProgress: 100,
        }, false, 'completeLoading')
      },

      proceedToAction: () => {
        set({ phase: GamePhase.ACTION }, false, 'proceedToAction')
      },

      submitPregeneratedAction: (actionId, actionText) => {
        const { cycleIndex, history } = get()
        const action: ActionEntry = {
          type: 'action',
          id: generateId(),
          text: actionText,
          actionType: ActionType.PREGENERATED,
          pregeneratedActionId: actionId,
          timestamp: Date.now(),
        }
        set({
          phase: GamePhase.LOADING,
          cycleIndex: cycleIndex + 1,
          history: [...history, action],
          loadingProgress: 0,
          currentStory: null,
        }, false, 'submitPregeneratedAction')
      },

      submitCustomAction: (text) => {
        const { cycleIndex, history } = get()
        const action: ActionEntry = {
          type: 'action',
          id: generateId(),
          text,
          actionType: ActionType.CUSTOM,
          timestamp: Date.now(),
        }
        set({
          phase: GamePhase.LOADING,
          cycleIndex: cycleIndex + 1,
          history: [...history, action],
          loadingProgress: 0,
          currentStory: null,
        }, false, 'submitCustomAction')
      },

      resetGame: () => {
        set(initialState, false, 'resetGame')
      },

      setError: (error) => {
        set({ error }, false, 'setError')
      },
    }),
    { name: 'game-store' }
  )
)

// Selectors for common derived state
export const selectIsPlaying = (state: GameState) => state.phase !== GamePhase.IDLE
export const selectIsLoading = (state: GameState) => state.phase === GamePhase.LOADING
export const selectCanAct = (state: GameState) => state.phase === GamePhase.ACTION
export const selectTotalCycles = (state: GameState) => state.cycleIndex
export const selectStoryEntries = (state: GameState) => 
  state.history.filter((h): h is StoryEntry => h.type === 'story')
export const selectActionEntries = (state: GameState) => 
  state.history.filter((h): h is ActionEntry => h.type === 'action')
