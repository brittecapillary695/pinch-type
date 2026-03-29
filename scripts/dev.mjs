import { context } from 'esbuild';

const ctx = await context({
  entryPoints: ['examples/basic/main.ts'],
  outfile: 'examples/basic/bundle.js',
  format: 'esm',
  bundle: true,
  target: 'es2020',
  sourcemap: true,
});

await ctx.serve({ servedir: 'examples/basic', port: 3000 });
console.log('→ http://localhost:3000');
