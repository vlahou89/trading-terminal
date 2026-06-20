import { useEffect, useRef, useState } from "react";
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type UTCTimestamp,
  type Time,
} from "lightweight-charts";
import { fetchHistoricalCandles } from "../../lib/ws/historicalCandles";
import { KlineFeedConnection } from "../../lib/ws/klineConnection";
import type { Candle } from "../../lib/ws/klineTypes";
import type { ConnectionStatus } from "../../lib/ws/types";
import { useOrderStore } from "../../lib/state/orderStore";
 
interface CandleChartProps {
  symbol: string;
  interval: string;
  onSymbolChange: (symbol: string) => void;
  onIntervalChange: (interval: string) => void;
}
 
const SYMBOL_OPTIONS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
 
// TradingView's own timeframe row, in the same order and labelling
// convention traders expect to see. Binance kline intervals use a
// different string format (1m, 1h, not 1, 60) so this also drives the
// mapping passed down to the WebSocket/REST layer.
const INTERVAL_OPTIONS: { label: string; value: string }[] = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1d" },
];
 
export function CandleChart({ symbol, interval, onSymbolChange, onIntervalChange }: CandleChartProps) {
  // The chart and series instances are imperative objects owned by the
  // lightweight-charts library, not React state. They're created once and
  // mutated directly (series.update(...)) rather than recreated on every
  // render — recreating the whole chart on every tick would defeat the
  // entire purpose of using a canvas-based charting library.
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  // v5 moved markers out of the series itself into a separate plugin
  // object returned by createSeriesMarkers — series.setMarkers() from
  // v3/v4 no longer exists.
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
 
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [loadError, setLoadError] = useState<string | null>(null);
 
  const fills = useOrderStore((state) => state.fills);
 
  // Effect 1: create the chart once on mount, tear it down on unmount.
  // Deliberately separate from the data-loading effect below — the chart's
  // lifecycle (DOM-bound) and the data's lifecycle (symbol/interval-bound)
  // change for different reasons and shouldn't share a dependency array.
  useEffect(() => {
    if (!containerRef.current) return;
 
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#787b86",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#1e222d" },
        horzLines: { color: "#1e222d" },
      },
      crosshair: {
        vertLine: { color: "#758696", labelBackgroundColor: "#2a2e39" },
        horzLine: { color: "#758696", labelBackgroundColor: "#2a2e39" },
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: "#2a2e39" },
      rightPriceScale: { borderColor: "#2a2e39" },
    });
 
    // v5 API: series types are added via chart.addSeries(SeriesTypeDefinition, options),
    // not the old per-type methods like addCandlestickSeries() from v3/v4.
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
 
    // Markers plugin attaches to the series but lives as its own object —
    // created once here, then re-fed new marker arrays via setMarkers()
    // whenever fills change (see Effect 3 below).
    const markersPlugin = createSeriesMarkers(series, []);
 
    chartRef.current = chart;
    seriesRef.current = series;
    markersPluginRef.current = markersPlugin;
 
    // Keep the chart's pixel size in sync with its container. Without this,
    // resizing the browser window leaves the chart at its original size.
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(containerRef.current);
 
    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersPluginRef.current = null;
    };
  }, []);
 
  // Effect 2: load historical candles, then open the live kline stream.
  // Re-runs when symbol or interval changes, so swapping symbols/timeframes
  // re-seeds the chart with that combination's own history instead of
  // mixing data from two different views.
  useEffect(() => {
    let isCancelled = false;
    setLoadError(null);
 
    fetchHistoricalCandles(symbol, interval, 200)
      .then((candles) => {
        if (isCancelled || !seriesRef.current) return;
        seriesRef.current.setData(
          candles.map((c) => ({
            time: c.time as UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );
        chartRef.current?.timeScale().fitContent();
      })
      .catch((err) => {
        if (!isCancelled) setLoadError(err.message);
      });
 
    const connection = new KlineFeedConnection(
      symbol,
      interval,
      (candle: Candle) => {
        // series.update() does double duty in lightweight-charts: passing a
        // time that matches the last bar UPDATES it in place; passing a new
        // time APPENDS a new bar. Binance's kline stream sends an update on
        // every trade within the current bar, so this single call handles
        // both "redraw the forming candle" and "start a new candle" cases.
        seriesRef.current?.update({
          time: candle.time as UTCTimestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });
      },
      setStatus
    );
    connection.connect();
 
    return () => {
      isCancelled = true;
      connection.disconnect();
    };
  }, [symbol, interval]);
 
  // Effect 3: redraw order-fill markers whenever a new order fills.
  // Markers are recomputed from the full fills list every time rather than
  // appended incrementally — the list is small (local simulation, not a
  // firehose), so simplicity wins over a more "efficient" diffing approach
  // that would add complexity for no measurable benefit at this scale.
  useEffect(() => {
    if (!markersPluginRef.current) return;
 
    const markers: SeriesMarker<Time>[] = fills
      .filter((fill) => fill.symbol === symbol)
      .map((fill) => ({
        // Binance kline times (and therefore the chart's own time axis)
        // are in unix SECONDS; filledAt is captured with Date.now(), which
        // is milliseconds — the same ms-to-seconds conversion that bit us
        // back in Milestone 2 applies here too.
        time: Math.floor(fill.filledAt / 1000) as UTCTimestamp,
        position: fill.side === "buy" ? "belowBar" : "aboveBar",
        shape: fill.side === "buy" ? "arrowUp" : "arrowDown",
        color: fill.side === "buy" ? "#2962ff" : "#f23645",
        text: `${fill.side === "buy" ? "BUY" : "SELL"} ${fill.quantity}`,
      }));
 
    markersPluginRef.current.setMarkers(markers);
  }, [fills, symbol]);
 
  return (
    <div className="candle-chart">
      <div className="candle-chart__toolbar">
        <div className="candle-chart__symbol-group">
          <select
            className="candle-chart__symbol-select"
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
          >
            {SYMBOL_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className={`connection-badge connection-badge--${status}`}>{status}</span>
        </div>
 
        <div className="candle-chart__intervals">
          {INTERVAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`candle-chart__interval-btn ${interval === opt.value ? "is-active" : ""}`}
              onClick={() => onIntervalChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
 
      {loadError && (
        <div className="candle-chart__error">Couldn't load chart history: {loadError}</div>
      )}
      <div ref={containerRef} className="candle-chart__canvas" />
    </div>
  );
}
