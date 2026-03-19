import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'encoding/index': 'src/encoding/index.ts',
    'hashing/index': 'src/hashing/index.ts',
    'data/index': 'src/data/index.ts',
    'conversion/index': 'src/conversion/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
});
