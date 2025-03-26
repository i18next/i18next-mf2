import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import yargs from 'yargs';

const argv = yargs(process.argv.slice(2)).argv;
const compress = argv.compact;

const babelOptions = {
  exclude: 'node_modules/**',
  presets: [['@babel/preset-env', { modules: false }]],
  babelrc: false,
};

const output = [
  {
    file: `dist/umd/i18nextMF2${compress ? '.min' : ''}.js`,
    format: 'umd',
    name: 'i18nextMF2',
  },
  {
    file: `dist/amd/i18nextMF2${compress ? '.min' : ''}.js`,
    format: 'amd',
    name: 'i18nextMF2',
  },
  {
    file: `dist/iife/i18nextMF2${compress ? '.min' : ''}.js`,
    format: 'iife',
    name: 'i18nextMF2',
  },
];

export default {
  input: 'src/index.js',
  plugins: [babel(babelOptions), nodeResolve({ mainField: ['jsnext:main'] })].concat(
    compress ? terser() : [],
  ),
  output,
};
