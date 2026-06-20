import { TickerStrip } from "./components/Ticker/TickerStrip";
import { CandleChart } from "./components/Chart/CandleChart";
import { DepthLadder } from "./components/OrderBook/DepthLadder";
import { OrderForm } from "./components/OrderEntry/OrderForm";
import { PositionsTable } from "./components/Blotter/PositionsTable";
import { useOrderPriceBridge } from "./lib/state/useOrderPriceBridge";
import "./App.css";
 
const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
 
function App() {
  useOrderPriceBridge(SYMBOLS);
 
  return (
    <div className="app">
      <h1>Live Trading Terminal</h1>
      <TickerStrip />
      <div className="app__chart-and-book">
        <CandleChart symbol="BTCUSDT" interval="1m" />
        <DepthLadder symbol="BTCUSDT" levels={10} />
      </div>
      <div className="app__order-and-blotter">
        <OrderForm symbol="BTCUSDT" />
        <PositionsTable />
      </div>
    </div>
  );
}

export default App;

