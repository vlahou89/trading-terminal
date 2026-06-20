// Raw shape of a Binance partial book depth stream message.
// Unlike the diff depth stream, this is a complete top-N snapshot on every
// message — no buffering, no update-ID reconciliation needed.
export interface BinanceDepthMessage {
  lastUpdateId: number;
  bids: [string, string][]; // [price, quantity], sorted highest to lowest
  asks: [string, string][]; // [price, quantity], sorted lowest to highest
}
 
// App-facing shape for a single price level in the ladder.
export interface DepthLevel {
  price: number;
  quantity: number;
}
 
export interface OrderBookSnapshot {
  bids: DepthLevel[];
  asks: DepthLevel[];
  lastUpdateId: number;
}
