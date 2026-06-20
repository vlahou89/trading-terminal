import type { BinanceDepthMessage, OrderBookSnapshot } from "./depthTypes";
import type { ConnectionStatus } from "./types";
 
const BINANCE_WS_BASE = "wss://stream.binance.com:9443/stream";
 
// "depth20@100ms" = top 20 levels each side, pushed up to every 100ms.
function buildDepthStreamUrl(symbol: string, levels: 5 | 10 | 20): string {
  return `${BINANCE_WS_BASE}?streams=${symbol.toLowerCase()}@depth${levels}@100ms`;
}
 
function toSnapshot(msg: BinanceDepthMessage): OrderBookSnapshot {
  return {
    lastUpdateId: msg.lastUpdateId,
    bids: msg.bids.map(([price, quantity]) => ({
      price: parseFloat(price), quantity: parseFloat(quantity),
    })),
    asks: msg.asks.map(([price, quantity]) => ({
      price: parseFloat(price), quantity: parseFloat(quantity),
    })),
  };
}
 
type SnapshotHandler = (snapshot: OrderBookSnapshot) => void;
type StatusHandler = (status: ConnectionStatus) => void;
 
export class DepthFeedConnection {
  private ws: WebSocket | null = null;
  private symbol: string;
  private levels: 5 | 10 | 20;
  private onSnapshot: SnapshotHandler;
  private onStatus: StatusHandler;
 
  private reconnectAttempts = 0;
  private maxBackoffMs = 30_000;
  private baseBackoffMs = 1_000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;
 
  constructor(symbol: string, levels: 5 | 10 | 20, onSnapshot: SnapshotHandler, onStatus: StatusHandler) {
    this.symbol = symbol;
    this.levels = levels;
    this.onSnapshot = onSnapshot;
    this.onStatus = onStatus;
  }
 
  connect(): void {
    this.manuallyClosed = false;
    this.onStatus(this.reconnectAttempts === 0 ? "connecting" : "reconnecting");
 
    const url = buildDepthStreamUrl(this.symbol, this.levels);
    this.ws = new WebSocket(url);
 
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.onStatus("open");
    };
 
    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data as string);
        const data: BinanceDepthMessage = parsed.data ?? parsed;
        this.onSnapshot(toSnapshot(data));
      } catch (err) {
        console.error("Failed to parse depth message", err);
      }
    };
 
    this.ws.onclose = () => {
      this.onStatus("closed");
      if (!this.manuallyClosed) this.scheduleReconnect();
    };
 
    this.ws.onerror = () => {
      console.error("WebSocket error on depth feed");
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
