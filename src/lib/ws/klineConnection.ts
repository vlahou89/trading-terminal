import type { BinanceKlineMessage, Candle } from "./klineTypes";
import type { ConnectionStatus } from "./types";
 
const BINANCE_WS_BASE = "wss://stream.binance.com:9443/stream";
 
function buildKlineStreamUrl(symbol: string, interval: string): string {
  return `${BINANCE_WS_BASE}?streams=${symbol.toLowerCase()}@kline_${interval}`;
}
 
function toCandle(k: BinanceKlineMessage["k"]): Candle {
  return {
    time: Math.floor(k.t / 1000),
    open: parseFloat(k.o),
    high: parseFloat(k.h),
    low: parseFloat(k.l),
    close: parseFloat(k.c),
  };
}
 
type CandleHandler = (candle: Candle) => void;
type StatusHandler = (status: ConnectionStatus) => void;
 
export class KlineFeedConnection {
  private ws: WebSocket | null = null;
  private symbol: string;
  private interval: string;
  private onCandle: CandleHandler;
  private onStatus: StatusHandler;
 
  private reconnectAttempts = 0;
  private maxBackoffMs = 30_000;
  private baseBackoffMs = 1_000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;
 
  constructor(symbol: string, interval: string, onCandle: CandleHandler, onStatus: StatusHandler) {
    this.symbol = symbol;
    this.interval = interval;
    this.onCandle = onCandle;
    this.onStatus = onStatus;
  }
 
  connect(): void {
    this.manuallyClosed = false;
    this.onStatus(this.reconnectAttempts === 0 ? "connecting" : "reconnecting");
 
    const url = buildKlineStreamUrl(this.symbol, this.interval);
    this.ws = new WebSocket(url);
 
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.onStatus("open");
    };
 
    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data as string);
        const data: BinanceKlineMessage = parsed.data ?? parsed;
        this.onCandle(toCandle(data.k));
      } catch (err) {
        console.error("Failed to parse kline message", err);
      }
    };
 
    this.ws.onclose = () => {
      this.onStatus("closed");
      if (!this.manuallyClosed) this.scheduleReconnect();
    };
 
    this.ws.onerror = () => {
      console.error("WebSocket error on kline feed");
    };
  }
 
  private scheduleReconnect(): void {
    this.reconnectAttempts += 1;
    const exponential = this.baseBackoffMs * 2 ** (this.reconnectAttempts - 1);
    const capped = Math.min(exponential, this.maxBackoffMs);
    const jitter = Math.random() * 0.3 * capped;
    const delay = capped + jitter;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
 
  disconnect(): void {
    this.manuallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}
