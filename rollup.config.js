
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from '@rollup/plugin-terser';

export default {
  input: 'ouranos-gex-lib-for-JavaScript/src/index.ts',
  output: {
    file: 'docs/lib/index.umd.js',
    format: 'umd',
    name: 'SpatialId',      // ← window.SpatialId を提供
    sourcemap: true
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    terser()
  ]
};
