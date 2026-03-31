# Pinch Lens Effect — Design Spec

## Overview
A "fish-eye lens" for text. Pinch near words and they magnify while surrounding text flows around them. Like a magnifying glass that reshapes the page.

## Desired Behavior

### Pinch In (fingers come together)
- Words **near** the pinch point **grow larger**
- Growth is smooth — gaussian falloff from pinch center
- Surrounding words (sides, above, below) **reflow to make space**
- Nothing ever leaves the frame or gets clipped
- Text "refactors" to new positions — lines re-wrap if needed

### Pinch Out (fingers spread apart)
- Opposite: nearby words **shrink**, surrounding text fills the gap

### Release
- Everything smoothly animates back to normal size and positions
- Recovery should feel fast and natural (~300-500ms), not sluggish

### Key Principle
**Words scale, not characters.** All characters in the same word share one scale factor based on the word's center distance from the pinch point.

## Visual Effect
- Different words on the **same line** can have different sizes
- Creates a fluid, organic feel — text as water
- Smooth transitions, no jarring snaps
- Brightness/opacity can subtly increase with scale for emphasis

## Technical Challenges (learned from v1/v2)

### Problem: Global Shrink Death Spiral
When enlarged words cause content to overflow the canvas, a naive approach shrinks ALL text to fit. This makes everything tiny and slow to recover.

**Solution ideas:**
- Don't shrink to fit — let content scroll instead (overflow = scrollable, not compressed)
- OR only shrink *distant* text (far from lens center), never the magnified words themselves
- OR cap minimum scale at 0.85 so text stays readable

### Problem: Layout Computation Per Frame
Reflowing all text every frame is expensive. With pretext doing line-level layout, per-word sizing requires creative workarounds.

**Solution ideas:**
- Pre-compute base layout once, only adjust positions (not full reflow) per frame
- Use canvas transforms per-word after base positioning
- Cache word measurements, only recompute affected lines

### Problem: Slow Animation Recovery
LERP-based animation with low speed (0.18) makes recovery feel stuck.

**Solution ideas:**
- Use higher LERP (0.3+) or spring physics for snappy feel
- Fast intensity decay (0.85× per frame or faster)
- Consider easing curve instead of linear lerp

### Problem: Pinch Direction
Mobile "pinch in" = fingers coming together = scale < 1. But the *desired* UX is "pinch in = magnify" (like zooming into text). Need to invert.

## Inputs
- **Touch**: Two-finger pinch with midpoint tracking
- **Trackpad**: ctrl+wheel (or meta+wheel) with cursor position
- **Mouse**: Could support scroll-wheel with modifier key

## API (proposed)
```ts
createPinchLens(container: HTMLElement, options?: {
  fontSize?: number;        // Base font size (default: 18)
  fontFamily?: string;      // Font family
  lineHeight?: number;      // Line height ratio (default: 1.57)
  padding?: number;         // Canvas padding (default: 28)
  background?: string;      // Canvas background (default: '#0a0a0a')
  lensRadius?: number;      // Radius of effect in px (default: 200)
  maxScale?: number;        // Max magnification (default: 2.5)
  friction?: number;        // Scroll friction (default: 0.95)
  onLens?: (intensity: number) => void;  // Callback on lens change
})
```

## Status
- v1: Per-glyph scaling — worked but scaled characters not words
- v2: Word grouping + reflow — global shrink made text tiny and stuck
- **Not yet production-ready.** Needs rethink of overflow handling before re-adding to demo site.
