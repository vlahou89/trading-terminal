import { memo, useEffect, useRef, useState } from "react";
import { useTick } from "../../lib/state/priceStore";
 
interface TickerCellProps {
  symbol: string;
}
 
function TickerCellComponent({ symbol }: TickerCellProps) {
  const tick = useTick(symbol);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevPrice = useRef<number | null>(null);
 
  useEffect(() => {
    if (!tick) return;
    if (prevPrice.current !== null) {
      if (tick.price > prevPrice.current) setFlash("up");
      else if (tick.price < prevPrice.current) setFlash("down");
    }
    prevPrice.current = tick.price;
 
    const timeout = setTimeout(() => setFlash(null), 400);
    return () => clearTimeout(timeout);
  }, [tick?.price]);
 
  if (!tick) {
    return (
      <div className="ticker-cell ticker-cell--loading">
        <span className="ticker-cell__symbol">{symbol}</span>
        <span className="ticker-cell__price">—</span>
      </div>
    );
  }
 
  const isUp = tick.changePercent >= 0;
 
  return (
    <div className={`ticker-cell ticker-cell--${flash ?? "idle"}`}>
      <span className="ticker-cell__symbol">{tick.symbol}</span>
      <span className="ticker-cell__price">
        {tick.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
      <span className={`ticker-cell__change ticker-cell__change--${isUp ? "pos" : "neg"}`}>
        {isUp ? "+" : ""}
        {tick.changePercent.toFixed(2)}%
      </span>
    </div>
  );
}
 
export const TickerCell = memo(TickerCellComponent);
