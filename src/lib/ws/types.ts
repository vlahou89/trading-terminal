// Raw shape of a Binance 24hr mini-ticker stream message.
// Binance sends short cryptic keys (e.g. "c" for close price) to save bandwidth.
// We map these to readable names in connection.ts rather than using raw keys
// throughout the app — keeps the rest of the codebase exchange-agnostic.
export interface BinanceTickerMessage {
  e: string; // event type, e.g. "24hrMiniTicker"
  E: number; // event time (ms epoch)
  s: string; // symbol, e.g. "BTCUSDT"
  c: string; // last/close price (string — Binance sends numbers as
             // strings to avoid float precision loss)
  o: string; // open price 24h ago
  h: string; // high price
  l: string; // low price
  v: string; // base asset volume
  q: string; // quote asset volume
}
 
// Clean, app-facing tick shape used everywhere else in the codebase.
export interface PriceTick {
  symbol: string;
  price: number;
  openPrice: number;
  high: number;
  low: number;
  changePercent: number; // derived: (price - openPrice) / openPrice * 100
  receivedAt: number;    // local timestamp when we processed this message
}
 
export type ConnectionStatus = "connecting" | "open" | "closed" | "reconnecting";
