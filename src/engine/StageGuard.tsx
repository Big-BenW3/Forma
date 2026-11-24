"use client";
/**
 * StageGuard
 * ==========
 * Keeps a 3D problem from taking the whole lesson down. Two things can go wrong
 * and both leave the lesson text, practice and navigation fully usable:
 *
 *  - the device has no WebGL (old browser, blocked GPU, some in-app browsers);
 *  - the model fails to load or the GPU context is lost (offline, flaky network).
 *
 * In either case the stage shows a short plain explanation instead of a blank or
 * a crash. A model that failed to load offers a Retry that remounts the canvas.
 */
import { Component, useEffect, useState, type ReactNode } from "react";

/** True when the browser can create a WebGL context at all. Cheap: one throwaway canvas. */
export function webglSupported(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function Message({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-8">
      <div role="status" className="max-w-[360px] rounded-[12px] border border-line bg-surface p-5 text-center">
        <p className="text-[15px] font-extrabold tracking-tight">{title}</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{body}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-3.5 rounded-[8px] bg-ink px-4 py-2 text-[12px] font-bold uppercase tracking-[0.1em] text-surface">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

class Boundary extends Component<{ children: ReactNode; onReset: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    // Kept for the developer console; the student sees the message below.
    console.error("[stage]", error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Message
        title="The model did not load"
        body="This can happen on a weak connection. The lesson text and practice still work. Try loading the model again."
        onRetry={() => {
          this.setState({ failed: false });
          this.props.onReset();
        }}
      />
    );
  }
}

export function StageGuard({ children }: { children: ReactNode }) {
  // Assume support on the first pass so server and client HTML agree, then check.
  const [supported, setSupported] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => setSupported(webglSupported()), []);

  if (!supported) {
    return (
      <Message
        title="3D is not available on this device"
        body="Your browser cannot show WebGL. Everything else in the lesson still works: the part cards, the tabs and the practice. Try a recent Chrome, Safari, Firefox or Edge for the model."
      />
    );
  }
  return (
    <Boundary key={attempt} onReset={() => setAttempt((a) => a + 1)}>
      {children}
    </Boundary>
  );
}
