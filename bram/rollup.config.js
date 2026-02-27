import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/thumbmark.js',
      format: 'umd',
      name: 'ThumbmarkJS',
      sourcemap: true
    },
    {
      file: 'dist/thumbmark.min.js',
      format: 'umd',
      name: 'ThumbmarkJS',
      plugins: [terser()],
      sourcemap: true
    },
    {
      file: 'demo/thumbmark.js',
      format: 'umd',
      name: 'ThumbmarkJS',
      sourcemap: false
    }
  ],
  plugins: [resolve()]
};
