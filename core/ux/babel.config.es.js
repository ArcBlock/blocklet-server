module.exports = {
  presets: [
    ['@babel/preset-env', { modules: false, targets: 'chrome 114' }],
    ['@babel/preset-react', { useBuiltIns: true, runtime: 'automatic' }],
  ],
  plugins: [
    './tools/babel-plugin-transform-svgr.js',
    'babel-plugin-inline-react-svg',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-proposal-class-properties',
  ],
};
