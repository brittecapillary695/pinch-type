# pinch-type

Three canvas-based text effects for mobile web, built on [`@chenglou/pretext`](https://github.com/chenglou/pretext).

- **Pinch Type** — intercepts pinch-to-zoom and scales text size instead of zooming the page
- **Scroll Morph** — fisheye effect: text near the viewport center is large and bright, edges are small and dim
- **Combined** — both effects together

[**Live Demo →**](https://pinch-type.surge.sh)

## Install

```bash
npm install pinch-type @chenglou/pretext
```

## Quick Start

```ts
import { createPinchType, createScrollMorph, createPinchMorph } from 'pinch-type';

// 1. Pinch Type — uniform text, pinch gestures scale all text
const pt = createPinchType(document.getElementById('reader'));
pt.setText('Your long article text here…');

// 2. Scroll Morph — fisheye effect, no pinch zoom
const sm = createScrollMorph(document.getElementById('reader'));
sm.setText('Your long article text here…');

// 3. Combined — fisheye + pinch-to-zoom (the original behavior)
const pm = createPinchMorph(document.getElementById('reader'));
pm.setText('Your long article text here…');

// Clean up when done:
instance.destroy();
```

The container element should have a defined width and height (e.g. `100vw × 100vh`). Each function creates a fullscreen `<canvas>` inside it.

## API

### `createPinchType(element, options?)`

Uniform text rendering with pinch-to-zoom scaling.

| Option | Type | Default | Description |
|---|---|---|---|
| `fontSize` | `number` | `18` | Base font size |
| `minFontSize` | `number` | `8` | Smallest size reachable via pinch |
| `maxFontSize` | `number` | `60` | Largest size reachable via pinch |
| `fontFamily` | `string` | `"Inter", system-ui, sans-serif` | CSS font-family |
| `lineHeight` | `number` | `1.57` | Line-height ratio |
| `padding` | `number` | `28` | Content padding (px) |
| `background` | `string` | `#0a0a0a` | Canvas background color |
| `friction` | `number` | `0.95` | Scroll momentum friction (0–1) |
| `onZoom` | `(fontSize) => void` | — | Callback after each pinch zoom |

### `createScrollMorph(element, options?)`

Fisheye scroll effect. No pinch-to-zoom.

| Option | Type | Default | Description |
|---|---|---|---|
| `centerFontSize` | `number` | `26` | Font size at viewport center |
| `edgeFontSize` | `number` | `11` | Font size at viewport edges |
| `morphRadius` | `number` | `300` | Radius (px) of the center→edge gradient |
| `fontFamily` | `string` | `"Inter", system-ui, sans-serif` | CSS font-family |
| `lineHeight` | `number` | `1.57` | Line-height ratio |
| `padding` | `number` | `28` | Content padding (px) |
| `background` | `string` | `#0a0a0a` | Canvas background color |
| `friction` | `number` | `0.95` | Scroll momentum friction (0–1) |

### `createPinchMorph(element, options?)`

Combined: fisheye scroll effect + pinch-to-zoom.

| Option | Type | Default | Description |
|---|---|---|---|
| `centerFontSize` | `number` | `26` | Font size at viewport center |
| `edgeFontSize` | `number` | `11` | Font size at viewport edges |
| `minFontSize` | `number` | `8` | Smallest size reachable via pinch |
| `maxFontSize` | `number` | `60` | Largest size reachable via pinch |
| `morphRadius` | `number` | `300` | Radius (px) of the center→edge gradient |
| `fontFamily` | `string` | `"Inter", system-ui, sans-serif` | CSS font-family |
| `lineHeight` | `number` | `1.57` | Line-height ratio |
| `padding` | `number` | `28` | Content padding (px) |
| `background` | `string` | `#0a0a0a` | Canvas background color |
| `friction` | `number` | `0.95` | Scroll momentum friction (0–1) |
| `onZoom` | `(center, edge) => void` | — | Callback after each pinch zoom |

### Instance Methods (all three)

| Method | Description |
|---|---|
| `setText(text)` | Update displayed text and re-layout |
| `resize()` | Force re-layout (auto-called on window resize) |
| `destroy()` | Remove canvas, listeners, and animation loop |
| `canvas` | The underlying `<canvas>` element (read-only) |

## How It Works

Text is measured and wrapped using [`@chenglou/pretext`](https://github.com/chenglou/pretext) for accurate segment-aware line breaking. Each frame, lines are drawn to a canvas. For scroll morph, font size and opacity are interpolated based on distance from the viewport center (ease-out cubic). Touch events drive momentum scrolling with configurable friction, and two-finger pinch gestures scale the font size range in real time.

## License

[MIT](./LICENSE) — Lucas Crespo
