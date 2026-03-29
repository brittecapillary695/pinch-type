# pinch-type

Pinch to zoom text, not the page.

A tiny library that intercepts pinch-to-zoom gestures on mobile web and scales text instead of zooming the viewport. Text is rendered to a `<canvas>` with a scroll-morph effect — lines near the center of the screen are large and bright, lines at the edges are small and dim. Pinch in to magnify, pinch out to shrink.

<!-- ![demo](https://raw.githubusercontent.com/lucascrespo/pinch-type/main/demo.gif) -->

## Install

```bash
npm install pinch-type @chenglou/pretext
```

## Quick Start

```ts
import { createPinchType } from 'pinch-type';

const pt = createPinchType(document.getElementById('reader'));

pt.setText('Your long article text here…');

// Later:
pt.destroy();
```

The container element should have a defined width and height (e.g. `100vw × 100vh`). `pinch-type` creates a fullscreen `<canvas>` inside it.

## API

### `createPinchType(element, options?)`

Returns a `PinchTypeInstance`.

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `minFontSize` | `number` | `8` | Smallest font size reachable via pinch |
| `maxFontSize` | `number` | `60` | Largest font size reachable via pinch |
| `initialFontSize` | `number` | `26` | Font size at viewport center |
| `edgeFontSize` | `number` | `11` | Font size at viewport edges |
| `fontFamily` | `string` | `"Inter", system-ui, sans-serif` | CSS font-family |
| `lineHeight` | `number` | `1.57` | Line-height ratio relative to font size |
| `padding` | `number` | `28` | Content padding (px) |
| `background` | `string` | `#0a0a0a` | Canvas background color |
| `morphRadius` | `number` | `300` | Radius (px) of the center → edge gradient |
| `friction` | `number` | `0.95` | Scroll momentum friction (0–1) |
| `onZoom` | `(center, edge) => void` | — | Callback fired after each pinch-zoom |

### Instance Methods

| Method | Description |
|---|---|
| `setText(text)` | Update displayed text and re-layout |
| `setZoom(center, edge?)` | Programmatically set zoom level |
| `resize()` | Force re-layout (auto-called on window resize) |
| `destroy()` | Remove canvas, listeners, and animation loop |
| `canvas` | The underlying `<canvas>` element (read-only) |

## How It Works

Text is measured and wrapped using [`@chenglou/pretext`](https://github.com/chenglou/pretext) for accurate segment-aware line breaking. Each frame, lines are drawn to a canvas with font size and opacity interpolated based on their distance from the viewport center (ease-out cubic). Touch events drive momentum scrolling with configurable friction, and two-finger pinch gestures scale the font size range in real time.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) — Lucas Crespo
