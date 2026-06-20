import type { BinanceTickerMessage, ConnectionStatus, PriceTick } from "./types";
 
// Binance combined-stream endpoint. "miniTicker" gives price/high/low/volume
// without the full order-book noise of the regular ticker.
const BINANCE_WS_BASE = "wss://stream.binance.com:9443/stream";
 
function buildStreamUrl(symbols: string[]): string {
  const streams = symbols
    .map((s) => `${s.toLowerCase()}@miniTicker`)
    .join("/");
  return `${BINANCE_WS_BASE}?streams=${streams}`;
}
 
function toPriceTick(msg: BinanceTickerMessage): PriceTick {
  const price = parseFloat(msg.c);
  const openPrice = parseFloat(msg.o);
  return {
    symbol: msg.s,
    price,
    openPrice,
    high: parseFloat(msg.h),
    low: parseFloat(msg.l),
    changePercent: ((price - openPrice) / openPrice) * 100,
    receivedAt: Date.now(),
  };
}
 
type TickHandler = (tick: PriceTick) => void;
type StatusHandler = (status: ConnectionStatus) => void;
 
export class PriceFeedConnection {
  private ws: WebSocket | null = null;
  private symbols: string[];
  private onTick: TickHandler;
  private onStatus: StatusHandler;
 
  private reconnectAttempts = 0;
  private maxBackoffMs = 30_000;
  private baseBackoffMs = 1_000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;
 
  constructor(symbols: string[], onTick: TickHandler, onStatus: StatusHandler) {
    this.symbols = symbols;
    this.onTick = onTick;
    this.onStatus = onStatus;
  }
 
  connect(): void {
    this.manuallyClosed = false;
    this.onStatus(this.reconnectAttempts === 0 ? "connecting" : "reconnecting");
 
    const url = buildStreamUrl(this.symbols);
    this.ws = new WebSocket(url);
 
    this.ws.onopen = () => {
      this.reconnectAttempts = 0; // reset backoff on a clean connect
      this.onStatus("open");
    };
 
    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data as string);
        const data: BinanceTickerMessage = parsed.data ?? parsed;
        this.onTick(toPriceTick(data));
      } catch (err) {
        console.error("Failed to parse tick message", err);
      }
    };
 
    this.ws.onclose = () => {
      this.onStatus("closed");
      if (!this.manuallyClosed) {
        this.scheduleReconnect();
      }
    };
 
    this.ws.onerror = () => {
      console.error("WebSocket error on price feed");
    };
  }
 
  private scheduleReconnect(): void {
    this.reconnectAttempts += 1;
    const exponential = this.baseBackoffMs * 2 ** (this.reconnectAttempts - 1);
    const capped = Math.min(exponential, this.maxBackoffMs);
    const jitter = Math.random() * 0.3 * capped; // up to 30% jitter
    const delay = capped + jitter;
 
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
 
  disconnect(): void {
    this.manuallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}
