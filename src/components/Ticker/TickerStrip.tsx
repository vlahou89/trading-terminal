import { useEffect, useRef } from "react";
import { PriceFeedConnection } from "../../lib/ws/connection";
import { usePriceStore, useConnectionStatus } from "../../lib/state/priceStore";
import { TickerCell } from "./TickerCell";
 
const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
 
interface TickerStripProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}
 
export function TickerStrip({ activeSymbol, onSelectSymbol }: TickerStripProps) {
  const setTick = usePriceStore((state) => state.setTick);
  const setStatus = usePriceStore((state) => state.setStatus);
  const status = useConnectionStatus();
 
  // useRef, not useState — the connection object itself should never trigger
  // a re-render and should persist across renders without being recreated.
  const connectionRef = useRef<PriceFeedConnection | null>(null);
 
  useEffect(() => {
    const connection = new PriceFeedConnection(SYMBOLS, setTick, setStatus);
    connectionRef.current = connection;
    connection.connect();
 
    // Cleanup on unmount: close the socket and cancel any pending reconnect.
    // Without this, navigating away and back (or React StrictMode's
    // mount-unmount-remount in dev) would leak sockets.
    return () => connection.disconnect();
  }, [setTick, setStatus]);
 
  return (
    <div className="ticker-strip">
      <div className="ticker-strip__brand">
        <span className="ticker-strip__logo">Live Trading Terminal</span>
        <span className={`connection-badge connection-badge--${status}`}>{status}</span>
      </div>
      <div className="ticker-strip__cells">
        {SYMBOLS.map((symbol) => (
          <TickerCell
            key={symbol}
            symbol={symbol}
            isActive={symbol === activeSymbol}
            onSelect={onSelectSymbol}
          />
        ))}
      </div>
    </div>
  );
}