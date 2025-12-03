// Starter stories

export interface StarterStory {
  id: string;
  title: string;
  description: string;
  setting: string;
  isCustom?: boolean;
}

export const STARTER_STORIES: StarterStory[] = [
  {
    id: "haunted-manor",
    title: "The Haunted Manor",
    description: "Investigate strange occurrences at Blackwood Estate",
    setting: "A decrepit Victorian manor shrouded in fog. The year is 1892.",
  },
  {
    id: "space-station",
    title: "Station Omega",
    description: "Survive aboard a malfunctioning space station",
    setting:
      "A research station orbiting Neptune. The year is 2347. Systems are failing.",
  },
  {
    id: "custom",
    title: "Create Your Own",
    description: "Write your own story setting",
    setting: "",
    isCustom: true,
  },
];
