import { create } from "zustand";
import type { OrderBookSnapshot } from "../ws/depthTypes";
import type { ConnectionStatus } from "../ws/types";
 
interface OrderBookState {
  snapshot: OrderBookSnapshot | null;
  status: ConnectionStatus;
  setSnapshot: (snapshot: OrderBookSnapshot) => void;
  setStatus: (status: ConnectionStatus) => void;
}
 
export const useOrderBookStore = create<OrderBookState>((set) => ({
  snapshot: null,
  status: "connecting",
  setSnapshot: (snapshot) => set({ snapshot }),
  setStatus: (status) => set({ status }),
}));
 
// rAF-batched writer. Holds onto the LATEST snapshot and only commits it
// to the store once per animation frame, coalescing any extra messages
// that arrived in between.
let pendingSnapshot: OrderBookSnapshot | null = null;
let rafId: number | null = null;
 
export function pushSnapshotBatched(snapshot: OrderBookSnapshot): void {
  pendingSnapshot = snapshot;
  if (rafId !== null) return; // a flush is already scheduled this frame
 
  rafId = requestAnimationFrame(() => {
    if (pendingSnapshot) {
      useOrderBookStore.getState().setSnapshot(pendingSnapshot);
    }
    pendingSnapshot = null;
    rafId = null;
  });
}
 
export function useOrderBookSnapshot(): OrderBookSnapshot | null {
  return useOrderBookStore((state) => state.snapshot);
}
 
export function useOrderBookStatus(): ConnectionStatus {
  return useOrderBookStore((state) => state.status);
}
