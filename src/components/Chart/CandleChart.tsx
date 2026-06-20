import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { fetchHistoricalCandles } from "../../lib/ws/historicalCandles";
import { KlineFeedConnection } from "../../lib/ws/klineConnection";
import type { Candle } from "../../lib/ws/klineTypes";
import type { ConnectionStatus } from "../../lib/ws/types";
 
interface CandleChartProps {
  symbol: string;
  interval?: string;
}
 
export function CandleChart({ symbol, interval = "1m" }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
 
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [loadError, setLoadError] = useState<string | null>(null);
 
  // Effect 1: create the chart once on mount, tear it down on unmount.
  useEffect(() => {
    if (!containerRef.current) return;
 
    const chart = createChart(containerRef.current, {
      layout: { background: { color: "transparent" }, textColor: "#8a93a3" },
      grid: {
        vertLines: { color: "#1c2230" },
        horzLines: { color: "#1c2230" },
      },
      width: containerRef.current.clientWidth,
      height: 400,
      timeScale: { timeVisible: true, secondsVisible: false },
    });
 
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#2ecc71",
      downColor: "#ff5555",
      borderVisible: false,
      wickUpColor: "#2ecc71",
      wickDownColor: "#ff5555",
    });
 
    chartRef.current = chart;
    seriesRef.current = series;
 
    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
    });
    resizeObserver.observe(containerRef.current);
 
    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);
 
  // Effect 2: load historical candles, then open the live kline stream.
  useEffect(() => {
    let isCancelled = false;
    setLoadError(null);
 
    fetchHistoricalCandles(symbol, interval, 200)
      .then((candles) => {
        if (isCancelled || !seriesRef.current) return;
        seriesRef.current.setData(
          candles.map((c) => ({
            time: c.time as UTCTimestamp,
            open: c.open, high: c.high, low: c.low, close: c.close,
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
        seriesRef.current?.update({
          time: candle.time as UTCTimestamp,
          open: candle.open, high: candle.high, low: candle.low, close: candle.close,
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
 
  return (
    <div className="candle-chart">
      <div className="candle-chart__header">
        <span className="candle-chart__symbol">{symbol}</span>
        <span className={`connection-badge connection-badge--${status}`}>
          {status}
        </span>
      </div>
      {loadError && (
        <div className="candle-chart__error">
          Couldn't load chart history: {loadError}
        </div>
      )}
      <div ref={containerRef} className="candle-chart__canvas" />
    </div>
  );
}
