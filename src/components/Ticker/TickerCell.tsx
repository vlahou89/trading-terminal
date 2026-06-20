import { memo, useEffect, useRef, useState } from "react";
import { useTick } from "../../lib/state/priceStore";
import { useLatencyTracking } from "../../lib/diagnostics/useLatencyTracking";
 
interface TickerCellProps {
  symbol: string;
  isActive: boolean;
  // Receives the SYMBOL that was clicked, called from inside this component
  // rather than the parent pre-binding a per-cell closure. Passing the same
  // onSelectSymbol reference down to every cell (instead of a fresh
  // () => onSelectSymbol(symbol) wrapper per cell) keeps the prop reference
  // stable across renders, which is what lets React.memo below actually
  // skip re-rendering cells whose own data hasn't changed.
  onSelect: (symbol: string) => void;
}
 
// React.memo means this component only re-renders if its OWN props change.
// Combined with the per-symbol selector in useTick, a tick for BTCUSDT
// will re-render *only* the BTCUSDT cell — every other symbol's cell
// skips re-rendering entirely. This is the core technique for handling
// high-frequency updates without the UI bogging down as symbol count grows.
function TickerCellComponent({ symbol, isActive, onSelect }: TickerCellProps) {
  const tick = useTick(symbol);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevPrice = useRef<number | null>(null);
 
  // Every ticker cell reports its own tick-to-render latency into the same
  // shared rolling sample window in the diagnostics store. Recording from
  // all four cells rather than just one gives a more representative average
  // across symbols, and since each cell only fires this on its own tick,
  // it doesn't add any cross-symbol coupling.
  useLatencyTracking(tick?.receivedAt);
 
  useEffect(() => {
    if (!tick) return;
    if (prevPrice.current !== null) {
      if (tick.price > prevPrice.current) setFlash("up");
      else if (tick.price < prevPrice.current) setFlash("down");
    }
    prevPrice.current = tick.price;
 
    // Clear the flash shortly after, so it reads as a "blip" rather than
    // a permanent colour change.
    const timeout = setTimeout(() => setFlash(null), 400);
    return () => clearTimeout(timeout);
  }, [tick?.price]);
 
  if (!tick) {
    return (
      <button className="ticker-cell ticker-cell--loading" disabled>
        <span className="ticker-cell__symbol">{symbol}</span>
        <span className="ticker-cell__price">—</span>
      </button>
    );
  }
 
  const isUp = tick.changePercent >= 0;
 
  return (
    <button
      className={`ticker-cell ticker-cell--${flash ?? "idle"} ${isActive ? "is-active" : ""}`}
      onClick={() => onSelect(symbol)}
    >
      <span className="ticker-cell__symbol">{tick.symbol}</span>
      <span className="ticker-cell__price">
        {tick.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
      <span className={`ticker-cell__change ticker-cell__change--${isUp ? "pos" : "neg"}`}>
        {isUp ? "+" : ""}
        {tick.changePercent.toFixed(2)}%
      </span>
    </button>
  );
}
 
export const TickerCell = memo(TickerCellComponent);
