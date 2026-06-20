// Tracks real browser frame timing using a standalone requestAnimationFrame
// loop. This runs independently of React — measuring "how often is the
// browser actually painting" is a statement about the browser's rendering
// pipeline, not about any particular component.
export class FrameRateTracker {
  private lastFrameTime: number | null = null;
  private frameTimes: number[] = [];
  private droppedFrames = 0;
  private rafId: number | null = null;
  private readonly maxSamples = 60; // roughly one second of history at 60fps
  private readonly expectedFrameMs = 1000 / 60;
 
  // A frame is counted "dropped" if the gap since the last frame is more
  // than ~2x the expected 16.6ms budget — the browser skipped painting
  // for at least one frame interval it should have hit. 2x rather than any
  // overage avoids flagging ordinary minor jitter as a dropped frame.
  private readonly droppedFrameThresholdMs = this.expectedFrameMs * 2;
 
  start(): void {
    const tick = (time: number) => {
      if (this.lastFrameTime !== null) {
        const delta = time - this.lastFrameTime;
        this.frameTimes.push(delta);
        if (this.frameTimes.length > this.maxSamples) this.frameTimes.shift();
        if (delta > this.droppedFrameThresholdMs) this.droppedFrames += 1;
      }
      this.lastFrameTime = time;
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
 
  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
 
  getFps(): number {
    if (this.frameTimes.length === 0) return 0;
    const avgFrameTime = this.frameTimes.reduce((sum, t) => sum + t, 0) / this.frameTimes.length;
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }
 
  getDroppedFrames(): number {
    return this.droppedFrames;
  }
}
