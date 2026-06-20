import { useEffect, useRef } from "react";
import { PriceFeedConnection } from "../../lib/ws/connection";
import { usePriceStore, useConnectionStatus } from "../../lib/state/priceStore";
import { TickerCell } from "./TickerCell";
 
const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
 
export function TickerStrip() {
  const setTick = usePriceStore((state) => state.setTick);
  const setStatus = usePriceStore((state) => state.setStatus);
  const status = useConnectionStatus();
 
  const connectionRef = useRef<PriceFeedConnection | null>(null);
 
  useEffect(() => {
    const connection = new PriceFeedConnection(SYMBOLS, setTick, setStatus);
    connectionRef.current = connection;
    connection.connect();
 
    return () => connection.disconnect();
  }, [setTick, setStatus]);
 
  return (
    <div className="ticker-strip">
      <div className={`connection-badge connection-badge--${status}`}>
        {status}
      </div>
      <div className="ticker-strip__cells">
        {SYMBOLS.map((symbol) => (
          <TickerCell key={symbol} symbol={symbol} />
        ))}
      </div>
    </div>
  );
}
