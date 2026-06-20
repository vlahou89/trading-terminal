import { useState } from "react";
import { TickerStrip } from "./components/Ticker/TickerStrip";
import { CandleChart } from "./components/Chart/CandleChart";
import { DepthLadder } from "./components/OrderBook/DepthLadder";
import { OrderForm } from "./components/OrderEntry/OrderForm";
import { PositionsTable } from "./components/Blotter/PositionsTable";
import { LatencyMonitor } from "./components/Diagnostics/LatencyMonitor";
import { useOrderPriceBridge } from "./lib/state/useOrderPriceBridge";
import "./App.css";
 
const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
 
function App() {
  // Mounted once near the root: bridges live ticks into pending limit
  // order checks, without priceStore and orderStore knowing about each other.
  useOrderPriceBridge(SYMBOLS);
 
  // Symbol and interval live here, not inside CandleChart, because the
  // order book and order form both need to track the SAME symbol the
  // chart is currently showing — a TradingView-style workspace switches
  // every panel together when you change the active market, not just the
  // chart in isolation.
  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT");
  const [activeInterval, setActiveInterval] = useState("1m");
 
  return (
    <div className="app">
      <TickerStrip activeSymbol={activeSymbol} onSelectSymbol={setActiveSymbol} />
 
    <div className="app__workspace">
  <CandleChart
    symbol={activeSymbol}
    interval={activeInterval}
    onSymbolChange={setActiveSymbol}
    onIntervalChange={setActiveInterval}
  />
  <div className="app__sidebar">
    <OrderForm symbol={activeSymbol} />
    <PositionsTable />
  </div>
</div>

 
      <LatencyMonitor />
    </div>
  );
}
 
export default App;
