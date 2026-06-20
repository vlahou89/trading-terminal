import { useEffect, useMemo, useRef } from "react";
import { DepthFeedConnection } from "../../lib/ws/depthConnection";
import {
  pushSnapshotBatched,
  useOrderBookSnapshot,
  useOrderBookStatus,
  useOrderBookStore,
} from "../../lib/state/orderBookStore";
import { LadderRow } from "./LadderRow";
import type { DepthLevel } from "../../lib/ws/depthTypes";
 
interface DepthLadderProps {
  symbol: string;
  levels?: 5 | 10 | 20;
}
 
function withDepthPercents(levels: DepthLevel[]): Array<DepthLevel & { depthPercent: number }> {
  let cumulative = 0;
  const withCumulative = levels.map((level) => {
    cumulative += level.quantity;
    return { ...level, cumulative };
  });
  const maxCumulative = withCumulative[withCumulative.length - 1]?.cumulative || 1;
  return withCumulative.map(({ cumulative: c, ...level }) => ({
    ...level,
    depthPercent: (c / maxCumulative) * 100,
  }));
}
 
export function DepthLadder({ symbol, levels = 10 }: DepthLadderProps) {
  const snapshot = useOrderBookSnapshot();
  const status = useOrderBookStatus();
  const setStatus = useOrderBookStore((state) => state.setStatus);
  const connectionRef = useRef<DepthFeedConnection | null>(null);
 
  useEffect(() => {
    const connection = new DepthFeedConnection(symbol, levels, pushSnapshotBatched, setStatus);
    connectionRef.current = connection;
    connection.connect();
    return () => connection.disconnect();
  }, [symbol, levels, setStatus]);
 
  const bidsWithDepth = useMemo(
    () => (snapshot ? withDepthPercents(snapshot.bids) : []),
    [snapshot]
  );
  const asksWithDepth = useMemo(
    () => (snapshot ? withDepthPercents(snapshot.asks).reverse() : []),
    [snapshot]
  );
 
  const bestBid = snapshot?.bids[0]?.price;
  const bestAsk = snapshot?.asks[0]?.price;
  const spread = bestBid && bestAsk ? bestAsk - bestBid : null;
 
  return (
    <div className="depth-ladder">
      <div className="depth-ladder__header">
        <span className="depth-ladder__symbol">{symbol} Order Book</span>
        <span className={`connection-badge connection-badge--${status}`}>{status}</span>
      </div>
 
      <div className="depth-ladder__columns">
        <span>Price</span>
        <span style={{ textAlign: "right" }}>Quantity</span>
      </div>
 
      <div className="depth-ladder__asks">
        {asksWithDepth.map((level) => (
          <LadderRow key={level.price} level={level} side="ask" depthPercent={level.depthPercent} />
        ))}
      </div>
 
      <div className="depth-ladder__spread">
        {spread !== null ? <span>Spread: {spread.toFixed(2)}</span> : <span>Loading book…</span>}
      </div>
 
      <div className="depth-ladder__bids">
        {bidsWithDepth.map((level) => (
          <LadderRow key={level.price} level={level} side="bid" depthPercent={level.depthPercent} />
        ))}
      </div>
    </div>
  );
}
