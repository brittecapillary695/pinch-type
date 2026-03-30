/**
 * Lightweight DOM-based pinch-to-zoom for regular HTML text.
 * No canvas, no dependencies. ~1KB minified.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PinchZoomOptions {
  /** Element to attach zoom to. Default: `document.documentElement` */
  target?: HTMLElement;
  /** Minimum font size in px. Default: `12` */
  min?: number;
  /** Maximum font size in px. Default: `32` */
  max?: number;
  /** Initial font size in px. Default: `16` */
  initial?: number;
  /** Pixels per zoom step. Default: `1` */
  step?: number;
  /** Callback after each zoom. */
  onZoom?: (fontSize: number) => void;
}

export interface UsePinchZoomOptions {
  /** Minimum font size. Default: `12` */
  min?: number;
  /** Maximum font size. Default: `32` */
  max?: number;
  /** Initial font size. Default: `16` */
  initial?: number;
  /** Pixels per zoom step. Default: `1` */
  step?: number;
  /** Callback after each zoom. */
  onZoom?: (fontSize: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

// ─── Vanilla API ─────────────────────────────────────────────────────────────

/**
 * Attach pinch-to-zoom font resizing to a DOM element.
 * Returns a cleanup function that removes all listeners.
 */
export function pinchZoom(options: PinchZoomOptions = {}): () => void {
  const target = options.target ?? document.documentElement;
  const min = options.min ?? 12;
  const max = options.max ?? 32;
  const step = options.step ?? 1;
  const onZoom = options.onZoom;

  let size = options.initial ?? 16;
  let pinchStartDist = 0;
  let pinchStartSize = 0;
  let accumulator = 0;
  const THRESHOLD = 20; // px of pinch distance per step

  target.style.fontSize = size + 'px';

  function setSize(s: number) {
    const clamped = clamp(Math.round(s), min, max);
    if (clamped !== size) {
      size = clamped;
      target.style.fontSize = size + 'px';
      onZoom?.(size);
    }
  }

  function dist(e: TouchEvent) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      pinchStartDist = dist(e);
      pinchStartSize = size;
      accumulator = 0;
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length !== 2) return;
    const d = dist(e);
    const delta = d - pinchStartDist;
    const steps = Math.trunc(delta / THRESHOLD);
    const newSize = pinchStartSize + steps * step;
    setSize(newSize);
    e.preventDefault();
  }

  function onWheel(e: WheelEvent) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    accumulator += e.deltaY;
    if (Math.abs(accumulator) >= 10) {
      const direction = accumulator > 0 ? -step : step;
      setSize(size + direction);
      accumulator = 0;
    }
  }

  target.addEventListener('touchstart', onTouchStart, { passive: true });
  target.addEventListener('touchmove', onTouchMove, { passive: false });
  target.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    target.removeEventListener('touchstart', onTouchStart);
    target.removeEventListener('touchmove', onTouchMove);
    target.removeEventListener('wheel', onWheel);
  };
}

// ─── React Hook ──────────────────────────────────────────────────────────────

/**
 * React hook for pinch-to-zoom font resizing.
 * Requires React as a peer dependency.
 *
 * ```tsx
 * function Reader() {
 *   const { fontSize, ref } = usePinchZoom({ min: 12, max: 32 })
 *   return <article ref={ref} style={{ fontSize }}>...</article>
 * }
 * ```
 */
export function usePinchZoom(options: UsePinchZoomOptions = {}): {
  fontSize: number;
  ref: (node: HTMLElement | null) => void;
} {
  // Dynamic require to avoid hard React dependency at module level
  let React: any;
  try {
    React = require('react');
  } catch {
    throw new Error('usePinchZoom requires React. Install it: npm install react');
  }

  const { useState, useCallback, useEffect, useRef } = React;
  const min = options.min ?? 12;
  const max = options.max ?? 32;
  const initial = options.initial ?? 16;
  const step = options.step ?? 1;

  const [fontSize, setFontSize] = useState(initial);
  const cleanupRef = useRef(null);
  const nodeRef = useRef(null);

  const ref = useCallback((node: HTMLElement | null) => {
    // Cleanup previous
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    nodeRef.current = node;
    if (node) {
      cleanupRef.current = pinchZoom({
        target: node,
        min,
        max,
        initial,
        step,
        onZoom: (size: number) => {
          setFontSize(size);
          options.onZoom?.(size);
        },
      });
    }
  }, [min, max, initial, step]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  return { fontSize, ref };
}
