import { TickerStrip } from "./components/Ticker/TickerStrip";
import { CandleChart } from "./components/Chart/CandleChart";
import { DepthLadder } from "./components/OrderBook/DepthLadder";
import "./App.css";
 
function App() {
  return (
    <div className="app">
      <h1>Live Trading Terminal</h1>
      <TickerStrip />
      <div className="app__chart-and-book">
        <CandleChart symbol="BTCUSDT" interval="1m" />
        <DepthLadder symbol="BTCUSDT" levels={10} />
      </div>
    </div>
  );
}
 
export default App;
