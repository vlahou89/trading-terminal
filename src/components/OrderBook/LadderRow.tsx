import { memo, useEffect, useRef, useState } from "react";
import type { DepthLevel } from "../../lib/ws/depthTypes";
 
interface LadderRowProps {
  level: DepthLevel;
  side: "bid" | "ask";
  depthPercent: number; // 0-100, used for the cumulative-size background bar
}
 
function LadderRowComponent({ level, side, depthPercent }: LadderRowProps) {
  const [flash, setFlash] = useState(false);
  const prevQuantity = useRef<number | null>(null);
 
  useEffect(() => {
    if (prevQuantity.current !== null && prevQuantity.current !== level.quantity) {
      setFlash(true);
      const timeout = setTimeout(() => setFlash(false), 250);
      prevQuantity.current = level.quantity;
      return () => clearTimeout(timeout);
    }
    prevQuantity.current = level.quantity;
  }, [level.quantity]);
 
  return (
    <div className={`ladder-row ladder-row--${side} ${flash ? "ladder-row--flash" : ""}`}>
      <div
        className={`ladder-row__depth-bar ladder-row__depth-bar--${side}`}
        style={{ width: `${depthPercent}%` }}
      />
      <span className="ladder-row__quantity">{level.quantity.toFixed(4)}</span>
      <span className={`ladder-row__price ladder-row__price--${side}`}>
        {level.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}

export const LadderRow = memo(LadderRowComponent);
