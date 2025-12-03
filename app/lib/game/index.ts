// Game API
export { game, useGameStore } from './controller'
export { 
  GamePhase, 
  selectIsPlaying, 
  selectIsLoading, 
  selectCanAct, 
  selectCanStart,
} from '../state-management/states'
export type { GameState, StoryEntry, ActionEntry, HistoryEntry } from '../state-management/states'
export { STARTER_STORIES } from '../story-generation/data'
export type { StarterStory } from '../story-generation/data'
