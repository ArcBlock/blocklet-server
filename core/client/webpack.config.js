const path = require('path');
const { DuplicatesPlugin } = require('inspectpack/plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  entry: ['react-app-polyfill/stable', './dist/browser.js'],
  target: ['web', 'es2017'],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'ABTNodeClient',
    libraryTarget: 'window',
  },
  resolve: {
    alias: {
      ms: require.resolve('ms'),
      debug: require.resolve('debug/src/browser'),
      axios: require.resolve('axios'),
      'bn.js': require.resolve('bn.js'),
      inherits: require.resolve('inherits'),
    },
  },
  plugins: [
    new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false }),
    new DuplicatesPlugin({
      emitErrors: false,
      emitHandler: undefined,
      verbose: false,
    }),
  ],
};
