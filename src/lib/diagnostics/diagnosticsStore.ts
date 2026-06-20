import { create } from "zustand";
 
interface DiagnosticsState {
  lastTickToRenderMs: number | null;
  latencySamples: number[];
  fps: number;
  droppedFrames: number;
  recordLatency: (ms: number) => void;
  setFrameStats: (fps: number, droppedFrames: number) => void;
}
 
const MAX_LATENCY_SAMPLES = 50;
 
export const useDiagnosticsStore = create<DiagnosticsState>((set) => ({
  lastTickToRenderMs: null,
  latencySamples: [],
  fps: 0,
  droppedFrames: 0,
 
  recordLatency: (ms) =>
    set((state) => {
      const samples = [...state.latencySamples, ms];
      if (samples.length > MAX_LATENCY_SAMPLES) samples.shift();
      return { lastTickToRenderMs: ms, latencySamples: samples };
    }),
 
  setFrameStats: (fps, droppedFrames) => set({ fps, droppedFrames }),
}));
 
export function useAvgLatency(): number | null {
  return useDiagnosticsStore((state) => {
    if (state.latencySamples.length === 0) return null;
    const sum = state.latencySamples.reduce((a, b) => a + b, 0);
    return sum / state.latencySamples.length;
  });
}
