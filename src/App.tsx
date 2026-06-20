import { TickerStrip } from "./components/Ticker/TickerStrip";
import { CandleChart } from "./components/Chart/CandleChart";
import "./App.css";
 
function App() {
  return (
    <div className="app">
      <h1>Live Trading Terminal</h1>
      <TickerStrip />
      <CandleChart symbol="BTCUSDT" interval="1m" />
    </div>
  );
}
 
export default App;
