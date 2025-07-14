import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'index.js',
  output: {
    file: 'dist/mwc-select.min.js',
    format: 'esm',
    sourcemap: false,
  },
  plugins: [
    resolve(),
    terser(), // Минификация
  ],
};