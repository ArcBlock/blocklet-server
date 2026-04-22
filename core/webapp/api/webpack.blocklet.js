const fs = require('fs');
// eslint-disable-next-line import/no-extraneous-dependencies
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const env = process.env.NODE_ENV || 'development';

const extraPlugins = [];
if (process.env.ANALYZE_BUNDLE) {
  extraPlugins.push(new BundleAnalyzerPlugin({ analyzerMode: 'static' }));
}

const extraAliases = {};
if (process.env.NODE_ENV === 'production') {
  const targetPath = require.resolve('express-graphql/renderGraphiQL');
  const sourcePath = require.resolve('@abtnode/mocks/lib/graphiql');
  fs.unlinkSync(targetPath);
  fs.copyFileSync(sourcePath, targetPath);
}

module.exports = webpack => ({
  optimization: {
    nodeEnv: env, // @link https://github.com/webpack/webpack/issues/7470#issuecomment-394259698
  },
  resolve: {
    alias: {
      axios: require.resolve('axios'),
      debug: require.resolve('debug'),
      joi: require.resolve('joi'),
      esprima: require.resolve('@abtnode/mocks/lib/dummy'),
      tr46: require.resolve('@abtnode/mocks/lib/dummy'),
      jspdf: require.resolve('@abtnode/mocks/lib/jspdf'),
      isobject: require.resolve('@abtnode/mocks/lib/isobject'),
      'google-protobuf/': require.resolve('google-protobuf/'),
      'vue-template-compiler': require.resolve('@abtnode/mocks/lib/vue-template-compiler'),
      'bn.js': require.resolve('bn.js'),
      'mime-db': require.resolve('mime-db'),
      'pg-hstore': require.resolve('@abtnode/mocks/lib/dummy'),
      ...extraAliases,
    },
  },
  externals: {
    filesize: 'commonjs filesize',
    // NOTICE: 不要添加 minimatch 作为 externals，会造成最终不知道 require 的是哪个版本
    // minimatch: 'commonjs minimatch',
    // @NOTE: 不能把 cheerio 作为 externals，不然发布之后会报错找不到 cheerio 包，但是本地却无法发现
    // cheerio: 'commonjs cheerio',
    '@ocap/proto': 'commonjs @ocap/proto',
    '@ocap/client': 'commonjs @ocap/client',
    '@blocklet/sdk': 'commonjs @blocklet/sdk',
    '@arcblock/ws': 'commonjs @arcblock/ws',
    '@arcblock/nft-display': 'commonjs @arcblock/nft-display',
    '@blocklet/meta': 'commonjs @blocklet/meta',
    '@blocklet/images': 'commonjs @blocklet/images',
    '@abtnode/auth': 'commonjs @abtnode/auth',
    '@blocklet/server-js': 'commonjs @blocklet/server-js',
    '@abtnode/util': 'commonjs @abtnode/util',
    '@abtnode/analytics': 'commonjs @abtnode/analytics',
    '@abtnode/models': 'commonjs @abtnode/models',
    '@abtnode/certificate-manager': 'commonjs @abtnode/certificate-manager',
    '@abtnode/db-cache': 'commonjs @abtnode/db-cache',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env),
      'process.env.TEST_BUILD': JSON.stringify(process.env.TEST_BUILD),
    }),
    ...extraPlugins,
  ],
});
