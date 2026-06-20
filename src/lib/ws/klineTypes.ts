// Binance's WebSocket kline stream wraps a "k" object inside each message.
// Note "x" (isFinal): a kline stream sends an update on EVERY trade within
// the current candle, not just when the candle closes. isFinal tells us
// whether this is the closing update for that time bucket.
export interface BinanceKlineMessage {
  e: string; // event type: "kline"
  E: number; // event time
  s: string; // symbol
  k: {
    t: number;  // kline start time (ms epoch)
    T: number;  // kline close time
    i: string;  // interval, e.g. "1m"
    o: string;  // open price
    h: string;  // high price
    l: string;  // low price
    c: string;  // close price (the "current" price while still forming)
    v: string;  // base asset volume
    x: boolean; // is this kline closed/final?
  };
}
 
// REST GET /api/v3/klines returns an array of raw arrays, one per kline:
// [ openTime, open, high, low, close, volume, closeTime, ...fields we ignore ]
export type BinanceRestKline = [
  number, string, string, string, string, string,
  number, string, number, string, string, string
];
 
// App-facing candle shape, matching what lightweight-charts expects:
// time in SECONDS (not ms — Binance is ms, the chart library is seconds).
export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
}
