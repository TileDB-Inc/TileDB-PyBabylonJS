const path = require('path');

// Custom webpack rules
const rules = [
  { test: /\.ts$/, loader: 'ts-loader', type: 'javascript/auto' },
  { test: /\.js$/, loader: 'source-map-loader', type: 'javascript/auto' },
  { test: /\.css$/, use: ['style-loader', 'css-loader'], type: 'javascript/auto'}
];

// Packages that shouldn't be bundled but loaded at runtime
const externals = ['@jupyter-widgets/base', 'module'];

const resolve = {
  // Add '.ts' and '.tsx' as resolvable extensions.
  extensions: [".webpack.js", ".web.js", ".ts", ".js"],
  fallback: {
    os: false,
  }
};

module.exports = [
  /**
   * Embeddable @tiledb-inc/pybabylonjs bundle
   *
   * This bundle is almost identical to the notebook extension bundle. The only
   * difference is in the configuration of the webpack public path for the
   * static assets.
   *
   * The target bundle is always `dist/index.js`, which is the path required by
   * the custom widget embedder.
   */
  {
    entry: ['./amd-public-path.js', './src/embed.ts'],
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'amd',
        library: "@tiledb-inc/pybabylonjs",
        publicPath: '', // Set in amd-public-path.js
    },
    devtool: 'source-map',
    module: {
        rules: rules
    },
    externals,
    resolve,
  }
];
