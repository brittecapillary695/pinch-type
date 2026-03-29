# Contributing to pinch-type

Thanks for your interest! Here's how to get started.

## Setup

```bash
git clone https://github.com/lucascrespo/pinch-type.git
cd pinch-type
npm install
npm run dev
```

Open `http://localhost:3000` on your phone (or use Chrome DevTools mobile emulation with touch).

## Development

- Source lives in `src/index.ts`
- `npm run dev` — starts a dev server with the example
- `npm run build` — builds ESM + CJS to `dist/`
- `npm run typecheck` — runs the TypeScript compiler

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `npm run build` and `npm run typecheck` pass
4. Open a PR with a clear description

## Code Style

- Keep it simple. This is a small, focused library.
- Comment *why*, not *what*.
- No runtime dependencies beyond `@chenglou/pretext`.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
