import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const GamePhase = {
  IDLE: "idle",
  INTRO: "intro",
  LOADING: "loading",
  STORY: "story",
  ACTION: "action",
} as const;

export type GamePhaseType = (typeof GamePhase)[keyof typeof GamePhase];

export interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface StoryEntry {
  type: "story";
  id: string;
  narrativeText: string;
  actions: string[];
  audioBase64: string | null;
  alignment: Alignment | null;
  timestamp: number;
}

export interface ActionEntry {
  type: "action";
  id: string;
  text: string;
  isCustom: boolean;
  timestamp: number;
}

export type HistoryEntry = StoryEntry | ActionEntry;

export interface GameState {
  // Core game state
  sessionId: string | null;
  phase: GamePhaseType;
  cycleIndex: number;
  starterStoryId: string | null;
  customSetting: string | null;
  currentStory: StoryEntry | null;
  history: HistoryEntry[];
  loadingProgress: number;
  error: string | null;

  // Soundstage (ambient background audio)
  soundstageUrl: string | null;
  soundstageLoading: boolean;

  // Action sound effect (one-shot sound played after action completes)
  actionSoundUrl: string | null;
  actionSoundLoading: boolean;

  // UI state
  isGenerating: boolean;
  pendingStarter: string | null;
  pendingCustomSetting: string;
  customActionInput: string;
}

export interface GameActions {
  // UI actions
  setStarter: (id: string | null) => void;
  setCustomSetting: (text: string) => void;
  setCustomActionInput: (text: string) => void;

  // Internal actions - use GameController instead
  _setPhase: (phase: GamePhaseType) => void;
  _setGenerating: (isGenerating: boolean) => void;
  _setLoading: (progress: number) => void;
  _setStory: (
    narrativeText: string,
    actions: string[],
    audioBase64: string | null,
    alignment: Alignment | null,
    setPhase?: boolean
  ) => void;
  _addAction: (text: string, isCustom: boolean) => void;
  _setConfig: (starterStoryId: string, customSetting?: string) => void;
  _setError: (error: string | null) => void;
  _setSoundstage: (url: string | null, loading?: boolean) => void;
  _setActionSound: (url: string | null, loading?: boolean) => void;
  _reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const initialState: GameState = {
  sessionId: null,
  phase: GamePhase.IDLE,
  cycleIndex: 0,
  starterStoryId: null,
  customSetting: null,
  currentStory: null,
  history: [
    {
      type: "story",
      id: "initial-story",
      narrativeText: "Select a genre and setting to begin your journey.",
      actions: [
        "Year is 1692 - Investigate strange occurrences at Blackwood Estate in a fantasy world",
        "Year is 2193 - Survive aboard a malfunctioning space station in a post-apocalyptic world",
      ],
      alignment: null,
      audioBase64: null,
      timestamp: new Date(0).getTime(),
    },
  ],
  loadingProgress: 0,
  error: null,
  soundstageUrl: null,
  soundstageLoading: false,
  actionSoundUrl: null,
  actionSoundLoading: false,
  isGenerating: false,
  pendingStarter: null,
  pendingCustomSetting: "",
  customActionInput: "",
};

export const useGameStore = create<GameState & GameActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // UI actions
      setStarter: (id) => set({ pendingStarter: id }, false, "setStarter"),
      setCustomSetting: (text) =>
        set({ pendingCustomSetting: text }, false, "setCustomSetting"),
      setCustomActionInput: (text) =>
        set({ customActionInput: text }, false, "setCustomActionInput"),

      // Internal actions
      _setPhase: (phase) => set({ phase }, false, "_setPhase"),
      _setGenerating: (isGenerating) =>
        set({ isGenerating }, false, "_setGenerating"),

      _setLoading: (progress) =>
        set(
          {
            loadingProgress: Math.min(100, Math.max(0, progress)),
          },
          false,
          "_setLoading"
        ),

      _setStory: (
        narrativeText,
        actions,
        audioBase64,
        alignment,
        setPhase = true
      ) => {
        const story: StoryEntry = {
          type: "story",
          id: generateId(),
          narrativeText,
          actions,
          audioBase64,
          alignment,
          timestamp: Date.now(),
        };
        set(
          {
            ...(setPhase ? { phase: GamePhase.STORY } : {}),
            currentStory: story,
            history: [...get().history, story],
            loadingProgress: 100,
          },
          false,
          "_setStory"
        );
      },

      _addAction: (text, isCustom) => {
        const action: ActionEntry = {
          type: "action",
          id: generateId(),
          text,
          isCustom,
          timestamp: Date.now(),
        };
        set(
          {
            phase: GamePhase.LOADING,
            cycleIndex: get().cycleIndex + 1,
            history: [...get().history, action],
            loadingProgress: 0,
            currentStory: null,
            customActionInput: "",
          },
          false,
          "_addAction"
        );
      },

      _setConfig: (starterStoryId, customSetting) =>
        set(
          {
            sessionId: generateId(),
            starterStoryId,
            customSetting: customSetting || null,
            phase: GamePhase.LOADING,
            loadingProgress: 0,
          },
          false,
          "_setConfig"
        ),

      _setError: (error) => set({ error }, false, "_setError"),

      _setSoundstage: (url, loading = false) =>
        set(
          {
            soundstageUrl: url,
            soundstageLoading: loading,
          },
          false,
          "_setSoundstage"
        ),

      _setActionSound: (url, loading = false) =>
        set(
          {
            actionSoundUrl: url,
            actionSoundLoading: loading,
          },
          false,
          "_setActionSound"
        ),

      _reset: () => set(initialState, false, "_reset"),
    }),
    { name: "game-store" }
  )
);

// Selectors - only primitives/booleans to avoid reference issues
export const selectIsPlaying = (s: GameState) => s.phase !== GamePhase.IDLE;
export const selectIsLoading = (s: GameState) => s.phase === GamePhase.LOADING;
export const selectCanAct = (s: GameState) => s.phase === GamePhase.ACTION;
export const selectCanStart = (s: GameState) =>
  s.pendingStarter !== null &&
  (s.pendingStarter !== "custom" || s.pendingCustomSetting.trim() !== "");
