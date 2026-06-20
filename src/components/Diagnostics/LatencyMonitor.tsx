import { useEffect, useRef } from "react";
import { FrameRateTracker } from "../../lib/diagnostics/frameRateTracker";
import { useAvgLatency, useDiagnosticsStore } from "../../lib/diagnostics/diagnosticsStore";
 
const POLL_INTERVAL_MS = 500;
 
export function LatencyMonitor() {
  const trackerRef = useRef<FrameRateTracker | null>(null);
  const avgLatency = useAvgLatency();
  const lastLatency = useDiagnosticsStore((state) => state.lastTickToRenderMs);
  const fps = useDiagnosticsStore((state) => state.fps);
  const droppedFrames = useDiagnosticsStore((state) => state.droppedFrames);
  const setFrameStats = useDiagnosticsStore((state) => state.setFrameStats);
 
  useEffect(() => {
    const tracker = new FrameRateTracker();
    trackerRef.current = tracker;
    tracker.start();
 
    const interval = setInterval(() => {
      setFrameStats(tracker.getFps(), tracker.getDroppedFrames());
    }, POLL_INTERVAL_MS);
 
    return () => {
      clearInterval(interval);
      tracker.stop();
    };
  }, [setFrameStats]);
 
  const fpsHealthClass = fps >= 55 ? "is-good" : fps >= 30 ? "is-warn" : "is-bad";
  const latencyHealthClass =
    avgLatency === null ? "" : avgLatency < 50 ? "is-good" : avgLatency < 150 ? "is-warn" : "is-bad";
 
  return (
    <div className="latency-monitor">
      <h3 className="latency-monitor__heading">Diagnostics</h3>
      <div className="latency-monitor__grid">
        <div className="latency-monitor__stat">
          <span className="latency-monitor__label">FPS</span>
          <span className={`latency-monitor__value ${fpsHealthClass}`}>{fps.toFixed(0)}</span>
        </div>
        <div className="latency-monitor__stat">
          <span className="latency-monitor__label">Dropped frames</span>
          <span className={`latency-monitor__value ${droppedFrames > 0 ? "is-warn" : "is-good"}`}>{droppedFrames}</span>
        </div>
        <div className="latency-monitor__stat">
          <span className="latency-monitor__label">Last tick→render</span>
          <span className="latency-monitor__value">{lastLatency !== null ? `${lastLatency.toFixed(0)}ms` : "—"}</span>
        </div>
        <div className="latency-monitor__stat">
          <span className="latency-monitor__label">Avg tick→render</span>
          <span className={`latency-monitor__value ${latencyHealthClass}`}>{avgLatency !== null ? `${avgLatency.toFixed(0)}ms` : "—"}</span>
        </div>
      </div>
    </div>
  );
}
