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

// Mood types for progressive music
export const Mood = {
  CALM: "calm",
  TENSE: "tense",
  DANGER: "danger",
  MYSTERY: "mystery",
  TRIUMPH: "triumph",
} as const;

export type MoodType = (typeof Mood)[keyof typeof Mood];

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
  choiceIndex: number;
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

  // Progressive mood music (changes based on story mood)
  currentMood: MoodType | null;
  moodMusicUrl: string | null;
  moodMusicLoading: boolean;

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
  _addAction: (text: string, choiceIndex: number, isCustom: boolean) => void;
  _setConfig: () => void;
  _setError: (error: string | null) => void;
  _setSoundstage: (url: string | null, loading?: boolean) => void;
  _setMoodMusic: (url: string | null, mood: MoodType | null, loading?: boolean) => void;
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
  history: [],
  loadingProgress: 0,
  error: null,
  soundstageUrl: null,
  soundstageLoading: false,
  currentMood: null,
  moodMusicUrl: null,
  moodMusicLoading: false,
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

      _addAction: (text, choiceIndex, isCustom) => {
        const action: ActionEntry = {
          type: "action",
          id: generateId(),
          text,
          choiceIndex,
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

      _setConfig: () =>
        set(
          {
            sessionId: generateId(),
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

      _setMoodMusic: (url, mood, loading = false) =>
        set(
          {
            moodMusicUrl: url,
            currentMood: mood,
            moodMusicLoading: loading,
          },
          false,
          "_setMoodMusic"
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

      _reset: () => {
        // Diverse entry points across different universes and genres
        const entryPoints = [
          "Magical fantasy with dark mages to defeat",
          "Post-apocalyptic space station survival",
          "Noir detective story in Prohibition-era Chicago",
          "Floating cloud city political intrigue",
          "Cursed pirate ship in the Caribbean",
          "Cyberpunk corporate megacorp infiltration",
          "Medieval alchemist seeking plague cure",
          "Abandoned research facility on Mars",
          "Victorian London consulting detective mysteries",
          "Starship navigating uncharted nebula",
          "Samurai castle defense in feudal Japan",
          "Sentient AI city neural network hack",
          "Lovecraftian horrors in coastal New England",
          "Radioactive wasteland scavenger survival",
          "French Revolution spy double agent",
          "Ancient alien ruins beneath exoplanet ocean",
          "World War II POW camp escape",
          "Mech suit war against rogue AI",
          "Elizabethan court conspiracy",
          "Zombie apocalypse in megacity",
          "Amazon rainforest lost civilization search",
          "Space colony peace negotiations",
          "Viking warrior during Norman conquest",
          "Biopunk corporate espionage",
          "Wild West supernatural creature hunt",
          "Retro-futuristic post-nuclear society rebuild",
          "Constantinople siege defense",
          "Virtual reality blurring with simulation",
          "American Revolution double agent",
          "Deep space asteroid mining operation",
        ];

        // Randomly select 2 unique entry points
        const shuffled = [...entryPoints].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 2);

        set(
          {
            ...initialState,
            history: [
              {
                type: "story",
                id: "initial-story",
                narrativeText:
                  "Select a genre and setting to begin your journey.",
                actions: selected,
                alignment: null,
                audioBase64: null,
                timestamp: new Date(0).getTime(),
              },
            ],
          },
          false,
          "_reset"
        );
      },
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
