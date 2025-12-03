import { create } from "zustand";

type CursorState = {
  worldX: number;
  worldY: number;
  worldZ: number;
  setWorldPosition: (x: number, y: number, z: number) => void;
};

export const useCursorStore = create<CursorState>((set) => ({
  worldX: 0,
  worldY: 0,
  worldZ: 0,
  setWorldPosition: (x, y, z) =>
    set(() => ({
      worldX: x,
      worldY: y,
      worldZ: z,
    })),
}));
