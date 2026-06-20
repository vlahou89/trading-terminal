# Live Trading Terminal

<img width="1138" height="635" alt="image" src="https://github.com/user-attachments/assets/bae41f34-2d89-42be-8f9b-09a93b09e88c" />
<img width="1107" height="634" alt="image" src="https://github.com/user-attachments/assets/0f02c7a7-6b96-4508-95a3-2031ef3c1dc4" />

A real-time cryptocurrency trading interface built to demonstrate the specific engineering challenges of high-frequency financial UIs: WebSocket lifecycle management, render performance under streaming data, and clean state architecture across interdependent features.

**Live data, not mocked.** Every price, candle, and order book level streams from Binance's public REST and WebSocket APIs in real time.

---

## What this project demonstrates

| Area | What's implemented |
|---|---|
| **Real-time data** | WebSocket connections with automatic reconnection, exponential backoff, and jitter — handles network drops gracefully instead of silently failing |
| **Render performance** | Per-symbol state selectors so a price update for one asset never re-renders unrelated UI; an animation-frame-batched store for a stream firing up to 10x/second |
| **State architecture** | Independent, decoupled stores (price data vs. order data) bridged through a single dedicated hook — each store is testable and reasoned about in isolation |
| **Order simulation** | Market and limit order matching, live per-tick P&L on open positions, and realised P&L locked in on close |
| **TypeScript discipline** | Exchange-specific API shapes are converted to clean internal types at the boundary — the rest of the app never touches a raw Binance payload directly |
| **UI/UX** | A layout and visual language matching TradingView's actual product conventions, built fully responsive from mobile to desktop |

---

## Tech stack

- **React 19** + **TypeScript** — strict typing throughout
- **Vite** — build tooling and dev server
- **Zustand** — state management, chosen specifically for its support of granular, per-key selectors (critical for a UI receiving multiple updates per second)
- **lightweight-charts** (TradingView's own open-source charting library) — canvas-based candlestick rendering with live order-fill markers
- **Binance Public API** — REST for historical data, WebSocket for live ticker, candle, and order book streams

No backend. No auth required. Runs entirely client-side against public market data.

---

## Engineering methodology

This project was built incrementally, with each stage solving one specific problem rather than building everything at once:

1. **Connection layer first.** A typed WebSocket client with reconnect/backoff logic was built and verified before any UI — getting the data layer right is the foundation everything else depends on.
2. **One performance technique per data source, matched to its actual frequency.** A ticker (~1 update/sec) needed only per-symbol selectors. An order book (~10 updates/sec) needed those *plus* animation-frame batching. Order fills (a handful per minute) needed neither — applying the order book's optimisation there would have been solving a problem that didn't exist.
3. **State ownership decided before styling.** When two features needed to share data (e.g. the chart and order form both needing the "active symbol"), that state was lifted to their common parent *before* any visual work began — restyling on top of a sound architecture is safe; restyling to paper over a structural gap isn't.
4. **Every build verified twice.** A fast type-check (`tsc --noEmit`) and a full production build (`tsc -b && vite build`) were run separately at each stage — they can disagree, and relying on only the faster check has caught real type errors late more than once during development.
5. **Bugs were found by checking assumptions, not just code.** A persistent layout issue turned out to live in a default Vite scaffold file, not in any component — solved by checking the DOM ancestor chain rather than re-reading the same stylesheet repeatedly.

---

## Run it locally

```bash
npm install
npm run dev
```

Requires no API keys, no environment variables, and no backend setup — it talks directly to Binance's public endpoints.

## Build

```bash
npm run build
```

---

## Project structure

```
src/
  lib/
    ws/            WebSocket + REST connections, typed message parsing
    state/         Zustand stores (price, orders) and the bridge between them
    diagnostics/   Frame-rate and latency measurement utilities
  components/
    Ticker/         Live price strip
    Chart/          Candlestick chart with toolbar and order-fill markers
    OrderEntry/     Buy/sell order form
    Blotter/        Open and closed positions, with realised P&L
    Diagnostics/    Performance monitoring panel
```

---

Built by Margarita Vlacho
