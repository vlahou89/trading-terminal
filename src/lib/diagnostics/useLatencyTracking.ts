import { useLayoutEffect } from "react";
import { useDiagnosticsStore } from "./diagnosticsStore";
 
// Measures the time between a tick's receivedAt timestamp (set the instant
// the WebSocket message was parsed, back in connection.ts) and the moment
// React actually commits a DOM update reflecting that tick.
//
// useLayoutEffect, not useEffect, is the deliberate choice: useLayoutEffect
// fires synchronously immediately after React applies DOM mutations but
// BEFORE the browser paints. useEffect is scheduled asynchronously after
// paint, which would measure "tick to paint plus whatever else happened to
// run first" rather than "tick to commit" — a noisier, less meaningful
// number for this specific question.
export function useLatencyTracking(receivedAt: number | undefined): void {
  const recordLatency = useDiagnosticsStore((state) => state.recordLatency);
 
  useLayoutEffect(() => {
    if (receivedAt === undefined) return;
 
    // receivedAt is captured with Date.now() in connection.ts. Measuring
    // elapsed time entirely within Date.now()'s own clock avoids mixing it
    // with performance.now(), which uses a different epoch and isn't
    // safely comparable to Date.now() without an explicit anchor.
    const latency = Date.now() - receivedAt;
 
    if (latency >= 0 && latency < 10_000) {
      recordLatency(latency);
    }
  }, [receivedAt, recordLatency]);
}
