// Everything here is LOCAL simulation only — no real exchange order is ever
// placed. The goal is to model the UX and state-management shape of a real
// order entry flow, not to build a real trading backend.
 
export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit";
 
export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limitPrice?: number; // only used when type === "limit"
}
 
export interface Position {
  id: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  entryPrice: number;
  openedAt: number;
}
 
export interface FilledOrder {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  fillPrice: number;
  filledAt: number;
}
 
// A limit order that hasn't filled yet sits here until the live price
// crosses its limit price, at which point it's moved into FilledOrder +
// Position. Market orders never appear here — they fill instantly.
export interface PendingOrder {
  id: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  limitPrice: number;
  placedAt: number;
}
