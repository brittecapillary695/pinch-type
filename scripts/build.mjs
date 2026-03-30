import { build } from 'esbuild';

// ESM
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.mjs',
  format: 'esm',
  bundle: true,
  external: ['@chenglou/pretext', 'react'],
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
  external: ['@chenglou/pretext', 'react'],
  target: 'es2020',
  minify: true,
  sourcemap: true,
});

// Type declarations (skip errors from dependencies)
try {
  const { execSync } = await import('child_process');
  execSync('npx tsc', { stdio: 'inherit' });
} catch {
  console.log('⚠ tsc had errors (likely from dependencies), skipping .d.ts generation');
}

console.log('✓ Built dist/index.mjs, dist/index.cjs');
