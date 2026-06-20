import { create } from "zustand";
import type { ConnectionStatus, PriceTick } from "../ws/types";
 
interface PriceStoreState {
  ticks: Record<string, PriceTick>; // keyed by symbol, e.g. "BTCUSDT"
  status: ConnectionStatus;
  setTick: (tick: PriceTick) => void;
  setStatus: (status: ConnectionStatus) => void;
}
 
export const usePriceStore = create<PriceStoreState>((set) => ({
  ticks: {},
  status: "connecting",
  setTick: (tick) =>
    set((state) => ({
      ticks: { ...state.ticks, [tick.symbol]: tick },
    })),
  setStatus: (status) => set({ status }),
}));
 
// Selector hook for a single symbol.
export function useTick(symbol: string): PriceTick | undefined {
  return usePriceStore((state) => state.ticks[symbol]);
}
 
export function useConnectionStatus(): ConnectionStatus {
  return usePriceStore((state) => state.status);
}
