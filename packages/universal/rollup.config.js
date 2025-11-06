import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'esm'
    },
    plugins: [typescript()]
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm'
    },
    plugins: [dts()]
  },
  {
    input: 'src/cli.ts',
    output: {
      file: 'dist/cli.js',
      format: 'esm',
      banner: '#!/usr/bin/env node'
    },
    plugins: [typescript()]
  }
];