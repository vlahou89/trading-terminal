import type { BinanceRestKline, Candle } from "./klineTypes";
 
const BINANCE_REST_BASE = "https://api.binance.com/api/v3/klines";
 
// Fetches historical candles so the chart isn't empty on first load.
// We only need this once per symbol/interval — after this, the WebSocket
// kline stream takes over and the chart updates live.
export async function fetchHistoricalCandles(
  symbol: string,
  interval: string = "1m",
  limit: number = 200
): Promise<Candle[]> {
  const url = `${BINANCE_REST_BASE}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
 
  if (!response.ok) {
    throw new Error(`Failed to fetch klines for ${symbol}: ${response.status}`);
  }
 
  const raw: BinanceRestKline[] = await response.json();
 
  return raw.map((k) => ({
    time: Math.floor(k[0] / 1000), // ms -> seconds
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
  }));
}
