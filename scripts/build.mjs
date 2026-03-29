import { build } from 'esbuild';
import { execSync } from 'child_process';

// ESM
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.mjs',
  format: 'esm',
  bundle: true,
  external: ['@chenglou/pretext'],
  target: 'es2020',
  minify: true,
  sourcemap: true,
});

// CJS
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.cjs',
  format: 'cjs',
  bundle: true,
  external: ['@chenglou/pretext'],
  target: 'es2020',
  minify: true,
  sourcemap: true,
});

// Type declarations
execSync('npx tsc', { stdio: 'inherit' });

console.log('✓ Built dist/index.mjs, dist/index.cjs, dist/index.d.ts');
