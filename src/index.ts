/**
 * pinch-type
 *
 * Pinch to zoom text, not the page.
 * Intercepts pinch gestures on mobile web and scales text instead of
 * zooming the viewport. Text is rendered to a <canvas> via @chenglou/pretext,
 * with a scroll-morph effect that enlarges lines near the viewport center
 * and shrinks lines at the edges.
 *
 * @license MIT
 * @author Lucas Crespo
 */

import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PinchTypeOptions {
  /** Smallest font size reachable via pinch-out. Default: `8` */
  minFontSize?: number;
  /** Largest font size reachable via pinch-in. Default: `60` */
  maxFontSize?: number;
  /** Font size at the viewport center before any pinch. Default: `26` */
  initialFontSize?: number;
  /** Font size at viewport edges before any pinch. Default: `11` */
  edgeFontSize?: number;
  /** CSS font-family string. Default: `"Inter", system-ui, sans-serif` */
  fontFamily?: string;
  /** Line-height ratio relative to font size. Default: `1.57` (~22/14) */
  lineHeight?: number;
  /** Content padding in CSS pixels. Default: `28` */
  padding?: number;
  /** Background color. Default: `#0a0a0a` */
  background?: string;
  /** Radius (px) of the morph gradient from viewport center. Default: `300` */
  morphRadius?: number;
  /** Scroll friction (0–1). Higher = more momentum. Default: `0.95` */
  friction?: number;
  /** Called after every pinch-zoom with the new center and edge sizes. */
  onZoom?: (centerSize: number, edgeSize: number) => void;
}

export interface PinchTypeInstance {
  /** Update the displayed text and re-layout. */
  setText(text: string): void;
  /** Programmatically set the zoom level (center font size). */
  setZoom(centerSize: number, edgeSize?: number): void;
  /** Force a resize / re-layout (called automatically on window resize). */
  resize(): void;
  /** Remove all listeners and the canvas element. */
  destroy(): void;
  /** The canvas element created by pinch-type. */
  readonly canvas: HTMLCanvasElement;
}

// ─── Internals ───────────────────────────────────────────────────────────────

interface Line {
  text: string;
  y: number;
  baseSize: number;
  weight: number;
}

// ─── Main ────────────────────────────────────────────────────────────────────

/**
 * Attach pinch-to-zoom text scaling to a container element.
 *
 * ```ts
 * import { createPinchType } from 'pinch-type';
 *
 * const pt = createPinchType(document.getElementById('reader')!, {
 *   initialFontSize: 24,
 *   onZoom: (center, edge) => console.log({ center, edge }),
 * });
 *
 * pt.setText('Your long article text here…');
 * ```
 */
export function createPinchType(
  container: HTMLElement,
  options: PinchTypeOptions = {},
): PinchTypeInstance {
  // ── Options ──────────────────────────────────────────────────────────────

  const minFont = options.minFontSize ?? 8;
  const maxFont = options.maxFontSize ?? 60;
  const fontFamily = options.fontFamily ?? '"Inter", system-ui, -apple-system, sans-serif';
  const lhRatio = options.lineHeight ?? 1.57;
  const padding = options.padding ?? 28;
  const bg = options.background ?? '#0a0a0a';
  const morphRadius = options.morphRadius ?? 300;
  const friction = options.friction ?? 0.95;
  const onZoom = options.onZoom;

  let centerSize = options.initialFontSize ?? 26;
  let edgeSize = options.edgeFontSize ?? 11;
  const initialCenterEdgeRatio = edgeSize / centerSize;

  // ── Canvas setup ─────────────────────────────────────────────────────────

  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.touchAction = 'none'; // prevent browser gestures
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  let dpr = Math.min(devicePixelRatio || 1, 3);
  let W = 0;
  let H = 0;

  // ── Text state ───────────────────────────────────────────────────────────

  let rawText = '';
  let lines: Line[] = [];
  let totalHeight = 0;
  let maxScroll = 0;

  // ── Scroll state ─────────────────────────────────────────────────────────

  let scrollY = 0;
  let scrollVelocity = 0;
  let touchLastY = 0;
  let touchLastTime = 0;
  let isTouching = false;

  // ── Pinch state ──────────────────────────────────────────────────────────

  let pinchActive = false;
  let pinchStartDist = 0;
  let pinchStartCenter = 0;
  let pinchStartEdge = 0;

  // ── Animation ────────────────────────────────────────────────────────────

  let raf = 0;
  let destroyed = false;

  // ── Layout ───────────────────────────────────────────────────────────────

  function layout() {
    if (!rawText || W === 0) return;

    const maxW = W - padding * 2;
    const fs = centerSize;
    const lh = fs * lhRatio;
    const font = `400 ${fs}px ${fontFamily}`;

    const paragraphs = rawText.split('\n\n');
    lines = [];
    let curY = padding + 10;

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      ctx.font = font;
      const prepared = prepareWithSegments(trimmed, font);
      const result = layoutWithLines(prepared, maxW, lh);

      for (let li = 0; li < result.lines.length; li++) {
        lines.push({
          text: result.lines[li].text,
          y: curY + li * lh,
          baseSize: fs,
          weight: 400,
        });
      }

      curY += result.lines.length * lh + lh * 0.6;
    }

    totalHeight = curY + padding;
    maxScroll = Math.max(0, totalHeight - H);

    // Clamp scroll
    scrollY = Math.max(0, Math.min(maxScroll, scrollY));
  }

  // ── Render ───────────────────────────────────────────────────────────────

  function render() {
    const d = dpr;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W * d, H * d);

    const viewCenter = H / 2;
    ctx.textBaseline = 'top';

    for (const line of lines) {
      const screenY = line.y - scrollY;

      // Cull off-screen lines
      if (screenY < -100 || screenY > H + 100) continue;

      // Distance from viewport center → morph factor
      const dist = Math.abs(screenY - viewCenter);
      const t = Math.min(dist / morphRadius, 1);
      const ease = 1 - (1 - t) ** 3; // ease-out cubic

      // Interpolate size and opacity
      const fontSize = centerSize + (edgeSize - centerSize) * ease;
      const opacity = 1.0 + (0.25 - 1.0) * ease;

      // Color: white at center → gray at edges
      const c = Math.round(255 - (255 - 102) * ease);
      const color = `rgb(${c},${c},${c})`;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.font = `${line.weight} ${fontSize * d}px ${fontFamily}`;

      const yOffset = (fontSize - line.baseSize) * 0.5;
      ctx.fillText(line.text, padding * d, (screenY - yOffset) * d);
      ctx.restore();
    }
  }

  // ── Animation loop ───────────────────────────────────────────────────────

  function loop() {
    if (destroyed) return;

    if (!isTouching) {
      scrollY += scrollVelocity;
      scrollVelocity *= friction;

      // Bounce back from edges
      if (scrollY < 0) {
        scrollY *= 0.85;
        scrollVelocity *= 0.5;
      } else if (scrollY > maxScroll) {
        scrollY = maxScroll + (scrollY - maxScroll) * 0.85;
        scrollVelocity *= 0.5;
      }

      if (Math.abs(scrollVelocity) < 0.1) scrollVelocity = 0;
    }

    render();
    raf = requestAnimationFrame(loop);
  }

  // ── Touch handling ───────────────────────────────────────────────────────

  function pinchDist(e: TouchEvent): number {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      pinchActive = true;
      pinchStartDist = pinchDist(e);
      pinchStartCenter = centerSize;
      pinchStartEdge = edgeSize;
      scrollVelocity = 0;
      isTouching = false;
    } else if (e.touches.length === 1 && !pinchActive) {
      isTouching = true;
      scrollVelocity = 0;
      touchLastY = e.touches[0].clientY;
      touchLastTime = performance.now();
    }
    e.preventDefault();
  }

  function onTouchMove(e: TouchEvent) {
    if (pinchActive && e.touches.length === 2) {
      const dist = pinchDist(e);
      const scale = dist / pinchStartDist;

      const newCenter = clamp(Math.round(pinchStartCenter * scale), minFont, maxFont);
      const newEdge = clamp(
        Math.round(pinchStartEdge * scale),
        Math.max(minFont, 6),
        Math.round(maxFont * initialCenterEdgeRatio),
      );

      if (newCenter !== centerSize || newEdge !== edgeSize) {
        centerSize = newCenter;
        edgeSize = newEdge;
        layout();
        onZoom?.(centerSize, edgeSize);
      }

      e.preventDefault();
      return;
    }

    if (!isTouching || e.touches.length !== 1) return;

    const y = e.touches[0].clientY;
    const dy = touchLastY - y;
    const now = performance.now();
    const dt = now - touchLastTime;

    scrollY += dy;
    scrollY = clamp(scrollY, -50, maxScroll + 50);

    if (dt > 0) {
      scrollVelocity = (dy / dt) * 16;
    }

    touchLastY = y;
    touchLastTime = now;
    e.preventDefault();
  }

  function onTouchEnd(e: TouchEvent) {
    if (e.touches.length < 2) pinchActive = false;
    if (e.touches.length === 0) isTouching = false;
  }

  function onWheel(e: WheelEvent) {
    scrollY += e.deltaY;
    scrollY = clamp(scrollY, -50, maxScroll + 50);
    e.preventDefault();
  }

  // ── Resize ───────────────────────────────────────────────────────────────

  function handleResize() {
    dpr = Math.min(devicePixelRatio || 1, 3);
    W = container.clientWidth;
    H = container.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    layout();
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────

  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('resize', handleResize);

  handleResize();
  raf = requestAnimationFrame(loop);

  // ── Public API ───────────────────────────────────────────────────────────

  return {
    setText(text: string) {
      rawText = text;
      scrollY = 0;
      scrollVelocity = 0;
      layout();
    },

    setZoom(newCenter: number, newEdge?: number) {
      centerSize = clamp(newCenter, minFont, maxFont);
      edgeSize = newEdge != null
        ? clamp(newEdge, minFont, maxFont)
        : clamp(Math.round(newCenter * initialCenterEdgeRatio), minFont, maxFont);
      layout();
      onZoom?.(centerSize, edgeSize);
    },

    resize: handleResize,

    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      canvas.remove();
    },

    get canvas() {
      return canvas;
    },
  };
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
