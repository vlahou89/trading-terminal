import { create } from "zustand";
import type { FilledOrder, OrderRequest, PendingOrder, Position } from "./orderTypes";
 
interface OrderStoreState {
  positions: Position[];
  fills: FilledOrder[];
  pendingOrders: PendingOrder[];
  placeOrder: (request: OrderRequest, currentPrice: number) => void;
  cancelPendingOrder: (id: string) => void;
  checkPendingOrders: (symbol: string, currentPrice: number) => void;
}
 
function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
 
function fillOrder(symbol: string, side: "buy" | "sell", type: "market" | "limit", quantity: number, fillPrice: number) {
  const id = makeId();
  const filledAt = Date.now();
  return {
    fill: { id, symbol, side, type, quantity, fillPrice, filledAt } as FilledOrder,
    position: { id, symbol, side, quantity, entryPrice: fillPrice, openedAt: filledAt } as Position,
  };
}
 
// A limit order crosses (is eligible to fill) when the live price has
// moved to a level the order taker would actually accept:
// - A BUY limit at $100 fills when price drops to $100 or below.
// - A SELL limit at $100 fills when price rises to $100 or above.
function hasCrossed(side: "buy" | "sell", limitPrice: number, currentPrice: number): boolean {
  return side === "buy" ? currentPrice <= limitPrice : currentPrice >= limitPrice;
}
 
export const useOrderStore = create<OrderStoreState>((set) => ({
  positions: [],
  fills: [],
  pendingOrders: [],
 
  placeOrder: (request, currentPrice) => {
    const { symbol, side, type, quantity, limitPrice } = request;
 
    if (type === "market") {
      const { fill, position } = fillOrder(symbol, side, "market", quantity, currentPrice);
      set((state) => ({ fills: [fill, ...state.fills], positions: [position, ...state.positions] }));
      return;
    }
 
    if (limitPrice === undefined) return;
 
    if (hasCrossed(side, limitPrice, currentPrice)) {
      const { fill, position } = fillOrder(symbol, side, "limit", quantity, limitPrice);
      set((state) => ({ fills: [fill, ...state.fills], positions: [position, ...state.positions] }));
    } else {
      const pending: PendingOrder = { id: makeId(), symbol, side, quantity, limitPrice, placedAt: Date.now() };
      set((state) => ({ pendingOrders: [pending, ...state.pendingOrders] }));
    }
  },
 
  cancelPendingOrder: (id) =>
    set((state) => ({ pendingOrders: state.pendingOrders.filter((order) => order.id !== id) })),
 
  checkPendingOrders: (symbol, currentPrice) =>
    set((state) => {
      const stillPending: PendingOrder[] = [];
      const newFills: FilledOrder[] = [];
      const newPositions: Position[] = [];
 
      for (const order of state.pendingOrders) {
        if (order.symbol !== symbol) {
          stillPending.push(order);
          continue;
        }
        if (hasCrossed(order.side, order.limitPrice, currentPrice)) {
          const { fill, position } = fillOrder(order.symbol, order.side, "limit", order.quantity, order.limitPrice);
          newFills.push(fill);
          newPositions.push(position);
        } else {
          stillPending.push(order);
        }
      }
 
      // Bail out without new array references if nothing changed — avoids
      // triggering re-renders on every tick when there's nothing pending.
      if (newFills.length === 0) return {};
 
      return {
        pendingOrders: stillPending,
        fills: [...newFills, ...state.fills],
        positions: [...newPositions, ...state.positions],
      };
    }),
}));
