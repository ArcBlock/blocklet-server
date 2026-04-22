// @ts-nocheck
const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const zlib = require('zlib');
const chalk = require('chalk');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const Table = require('cli-table3');
const { BLOCKLET_BUNDLE_FOLDER, BLOCKLET_ENTRY_FILE } = require('@blocklet/constant');
const { parse: parseBlockletMeta } = require('@blocklet/meta/lib/parse');

// eslint-disable-next-line import/no-extraneous-dependencies
const debug = require('@blocklet/cli/lib/debug')('bundle:webpack');
// eslint-disable-next-line import/no-extraneous-dependencies
const { print, getFileSize, printSuccess } = require('@blocklet/cli/lib/util');
// eslint-disable-next-line import/no-extraneous-dependencies
const { wrapSpinner } = require('@blocklet/cli/lib/ui');
// eslint-disable-next-line import/no-extraneous-dependencies
const { createBlockletBundle } = require('@blocklet/cli/lib/commands/blocklet/bundle/bundle');

const testFilePattern = '\\.(test|spec)\\.?';

// 是否启用依赖分析模式
const ANALYZE_DEPS = process.env.ANALYZE_DEPS === '1' || process.env.ANALYZE_DEPS === 'true';
// 显示前 N 个最大的模块
const ANALYZE_TOP_N = parseInt(process.env.ANALYZE_TOP_N || '30', 10);

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
const formatSize = bytes => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

/**
 * 从模块路径中提取包名
 * @param {string} modulePath - 模块路径
 * @returns {string} 包名
 */
const extractPackageName = modulePath => {
  const nodeModulesMatch = modulePath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
  if (nodeModulesMatch) {
    return nodeModulesMatch[1];
  }
  // 本地模块
  if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
    return modulePath;
  }
  return modulePath;
};

/**
 * 计算 gzip 压缩后的大小
 * @param {Buffer|string} content - 内容
 * @returns {number} gzip 后的字节数
 */
const getGzipSize = content => {
  try {
    return zlib.gzipSync(content, { level: 9 }).length;
  } catch {
    return 0;
  }
};

/**
 * 分析 webpack stats 中的模块大小分布
 * @param {object} stats - webpack 编译统计信息
 * @param {string} outputPath - 输出文件路径
 */
const analyzeModuleSizes = (stats, outputPath) => {
  const statsJson = stats.toJson({
    modules: true,
    assets: true,
    chunks: false,
    chunkGroups: false,
    chunkModules: false,
    reasons: false,
    source: false,
  });

  const { modules = [], assets = [] } = statsJson;

  // 获取最终 bundle 文件的实际大小和 gzip 大小
  let bundleSize = 0;
  let bundleGzipSize = 0;
  if (outputPath && fs.existsSync(outputPath)) {
    const bundleContent = fs.readFileSync(outputPath);
    bundleSize = bundleContent.length;
    bundleGzipSize = getGzipSize(bundleContent);
  } else if (assets.length > 0) {
    bundleSize = assets.reduce((sum, a) => sum + (a.size || 0), 0);
  }

  // 按模块大小排序
  const sortedModules = modules.filter(m => m.size > 0).sort((a, b) => b.size - a.size);

  // 按包名聚合大小
  const packageSizes = new Map();
  sortedModules.forEach(module => {
    const pkgName = extractPackageName(module.name || module.identifier || '');
    const current = packageSizes.get(pkgName) || { size: 0, count: 0, modules: [] };
    packageSizes.set(pkgName, {
      size: current.size + module.size,
      count: current.count + 1,
      modules: [...current.modules, module],
    });
  });

  // 转换为数组并排序
  const sortedPackages = Array.from(packageSizes.entries())
    .map(([name, { size, count, modules: mods }]) => ({ name, size, count, modules: mods }))
    .sort((a, b) => b.size - a.size);

  const totalSourceSize = sortedPackages.reduce((sum, p) => sum + p.size, 0);

  // 计算压缩比例（用于估算每个包在最终 bundle 中的占比）
  const compressionRatio = bundleSize > 0 ? bundleSize / totalSourceSize : 0.5;
  const gzipRatio = bundleGzipSize > 0 ? bundleGzipSize / bundleSize : 0.3;

  // ============ 打印包大小分布 ============
  print('\n');
  print(chalk.cyan.bold('='.repeat(90)));
  print(chalk.cyan.bold('📦 依赖包大小分布 (按源码大小排序)'));
  print(chalk.cyan.bold('='.repeat(90)));
  print(chalk.gray('提示: "估算 Bundle 占用" = 源码大小 × 压缩率，用于估算该包在最终 bundle 中的实际占比\n'));

  const pkgTable = new Table({
    head: ['#', '包名', '源码大小', '估算 Bundle 占用', '估算 Gzip', '占比', '模块'],
    style: { 'padding-left': 1, head: ['cyan', 'bold'] },
    colWidths: [4, 40, 12, 16, 12, 8, 6],
  });

  const topPackages = sortedPackages.slice(0, ANALYZE_TOP_N);
  topPackages.forEach((pkg, index) => {
    const percent = ((pkg.size / totalSourceSize) * 100).toFixed(1);
    const estimatedBundleSize = Math.round(pkg.size * compressionRatio);
    const estimatedGzipSize = Math.round(estimatedBundleSize * gzipRatio);
    let percentDisplay = `${percent}%`;
    if (percent > 10) {
      percentDisplay = chalk.red.bold(`${percent}%`);
    } else if (percent > 5) {
      percentDisplay = chalk.yellow(`${percent}%`);
    }
    pkgTable.push([
      index + 1,
      pkg.name.substring(0, 38),
      formatSize(pkg.size),
      formatSize(estimatedBundleSize),
      formatSize(estimatedGzipSize),
      percentDisplay,
      pkg.count,
    ]);
  });

  print(pkgTable.toString());

  // ============ 打印前 N 个最大的单个模块 ============
  print('\n');
  print(chalk.cyan.bold('='.repeat(90)));
  print(chalk.cyan.bold(`📄 最大的 ${ANALYZE_TOP_N} 个模块文件`));
  print(chalk.cyan.bold('='.repeat(90)));

  const moduleTable = new Table({
    head: ['#', '模块路径', '源码大小', '估算 Gzip', '占比'],
    style: { 'padding-left': 1, head: ['cyan', 'bold'] },
    colWidths: [4, 55, 12, 12, 8],
  });

  const topModules = sortedModules.slice(0, ANALYZE_TOP_N);
  topModules.forEach((module, index) => {
    const moduleName = (module.name || module.identifier || '').substring(0, 53);
    const percent = ((module.size / totalSourceSize) * 100).toFixed(1);
    const estimatedGzip = Math.round(module.size * compressionRatio * gzipRatio);
    let percentDisplay = `${percent}%`;
    if (percent > 5) {
      percentDisplay = chalk.red.bold(`${percent}%`);
    } else if (percent > 2) {
      percentDisplay = chalk.yellow(`${percent}%`);
    }
    moduleTable.push([index + 1, moduleName, formatSize(module.size), formatSize(estimatedGzip), percentDisplay]);
  });

  print(moduleTable.toString());

  // ============ 打印汇总统计 ============
  print('\n');
  print(chalk.cyan.bold('='.repeat(90)));
  print(chalk.cyan.bold('📊 汇总统计'));
  print(chalk.cyan.bold('='.repeat(90)));

  const summaryTable = new Table({
    style: { 'padding-left': 1 },
    colWidths: [25, 65],
  });

  const topPackagesSize = topPackages.reduce((sum, p) => sum + p.size, 0);
  summaryTable.push(
    { 总模块数: modules.length },
    { 总包数: packageSizes.size },
    { 源码总大小: formatSize(totalSourceSize) },
    { 'Bundle 大小 (Minified)': formatSize(bundleSize) },
    { 'Bundle 大小 (Gzip)': chalk.green.bold(formatSize(bundleGzipSize)) },
    { [`前 ${ANALYZE_TOP_N} 大包占比`]: `${((topPackagesSize / totalSourceSize) * 100).toFixed(1)}%` }
  );
  print(summaryTable.toString());

  // ============ 代码来源分布 ============
  const nodeModulesSize = sortedModules
    .filter(m => (m.name || '').includes('node_modules'))
    .reduce((sum, m) => sum + m.size, 0);
  const localCodeSize = totalSourceSize - nodeModulesSize;

  print('\n');
  print(chalk.cyan.bold('='.repeat(90)));
  print(chalk.cyan.bold('📁 代码来源分布'));
  print(chalk.cyan.bold('='.repeat(90)));

  const sourceTable = new Table({
    head: ['来源', '源码大小', '估算 Gzip', '占比'],
    style: { 'padding-left': 1, head: ['cyan', 'bold'] },
    colWidths: [20, 15, 15, 10],
  });
  sourceTable.push(
    [
      'node_modules',
      formatSize(nodeModulesSize),
      formatSize(Math.round(nodeModulesSize * compressionRatio * gzipRatio)),
      `${((nodeModulesSize / totalSourceSize) * 100).toFixed(1)}%`,
    ],
    [
      '本地代码',
      formatSize(localCodeSize),
      formatSize(Math.round(localCodeSize * compressionRatio * gzipRatio)),
      `${((localCodeSize / totalSourceSize) * 100).toFixed(1)}%`,
    ]
  );
  print(sourceTable.toString());
  print('\n');
};

const makeWebConfigBuilder =
  (entryFile, isHook = false) =>
  ({ userWebpackConfig } = {}) => {
    const blockletDir = process.cwd();
    let outputDir = blockletDir;
    let outputFileName = BLOCKLET_ENTRY_FILE;

    if (isHook) {
      outputDir = path.join(outputDir, BLOCKLET_BUNDLE_FOLDER, path.dirname(entryFile));
      outputFileName = path.basename(entryFile);
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true }); // node.js >= v10.12.0
    }

    debug('output dir:', outputDir);

    // Babel config
    const babelOpts = { cacheDirectory: true };
    babelOpts.presets = [[require.resolve('@babel/preset-env'), { targets: { node: '16.20.2' } }]];
    babelOpts.plugins = [];

    // Webpack config
    const env = process.env.NODE_ENV || 'development';
    const mode = ['production', 'development'].includes(env) ? env : 'none';

    let webpackConfig = {
      mode,
      resolve: {
        extensions: ['.wasm', '.mjs', '.js', '.json', '.ts'],
        mainFields: ['module', 'main'],
      },
      module: {
        rules: [
          {
            test: /\.(m?js|ts)?$/,
            exclude: new RegExp(`(node_modules|bower_components|${testFilePattern})`),
            use: {
              loader: require.resolve('babel-loader'),
              options: { ...babelOpts, babelrc: false },
            },
          },
        ],
      },
      context: blockletDir,
      entry: {
        [path.basename(entryFile, '.js')]: path.resolve('.', entryFile),
      },
      output: {
        path: outputDir,
        filename: outputFileName,
        library: {
          type: 'commonjs2',
        },
        chunkFormat: 'commonjs',
        chunkLoading: 'require',
        asyncChunks: false,
      },
      target: 'node',
      node: {
        __dirname: false,
        __filename: false,
      },
      plugins: [],
      optimization: {
        nodeEnv: env,
      },
      bail: true,
      devtool: false,
      stats: {
        colors: true,
      },
    };

    if (userWebpackConfig) {
      // eslint-disable-next-line
      const webpackAdditional = require(path.join(process.cwd(), userWebpackConfig));
      webpackConfig = merge(
        webpackConfig,
        typeof webpackAdditional === 'function' ? webpackAdditional(webpack) : webpackAdditional
      );
    }

    debug('webpack config', webpackConfig);
    return webpackConfig;
  };

const webpackPromise = promisify(webpack);

const printWebpackResult = (taskName, stats, outputPath) => {
  print(`bundle ${taskName} result:`);
  print(
    stats.toString({
      colors: true,
    })
  );

  // 如果启用了依赖分析模式，打印详细的模块大小分布
  if (ANALYZE_DEPS) {
    analyzeModuleSizes(stats, outputPath);
  }
};

const bundle = async ({ meta, blockletDir, userWebpackConfig }) => {
  // eslint-disable-next-line no-param-reassign
  meta = meta || parseBlockletMeta(blockletDir, { ensureFiles: true });

  const additionalConfig = { userWebpackConfig };
  const buildOutputDir = path.join(blockletDir, BLOCKLET_BUNDLE_FOLDER);

  if (fs.existsSync(buildOutputDir)) {
    fs.removeSync(buildOutputDir);
  } else {
    fs.mkdirSync(buildOutputDir, { recursive: true });
  }

  const mainPath = path.join(blockletDir, meta.main);
  const hasMainFile = fs.statSync(mainPath).isFile();
  if (hasMainFile) {
    const webConfigBuilder = makeWebConfigBuilder(meta.main, false);
    const stats = await wrapSpinner(`Bundling main file: ${chalk.cyan(meta.main)}`, () =>
      webpackPromise(webConfigBuilder(additionalConfig))); // prettier-ignore
    const outputPath = path.join(blockletDir, BLOCKLET_ENTRY_FILE);
    printWebpackResult(meta.main, stats, outputPath);
  }

  await wrapSpinner(`Creating blocklet bundle in ${chalk.cyan(BLOCKLET_BUNDLE_FOLDER)}...`, async () => {
    await createBlockletBundle({
      blockletDir,
      meta,
      updates: meta.group === 'dapp' ? { main: BLOCKLET_ENTRY_FILE } : {},
      inMonoRepo: true,
      withChangeLog: false,
    });
  });

  const tableHead = ['Category', 'File', 'Size'];
  const table = new Table({
    head: tableHead,
    style: { 'padding-left': 1, head: ['cyan', 'bold'] },
  });

  if (hasMainFile) {
    table.push(['Main', meta.main, getFileSize(path.join(blockletDir, BLOCKLET_BUNDLE_FOLDER, BLOCKLET_ENTRY_FILE))]);
  }

  if (table.length > 0) {
    print('Bundled file list:');
    print(table.toString());
  }

  // print total stats
  printSuccess(`Blocklet ${chalk.cyan(`${meta.name}@${meta.version}`)} was successfully bundled!`);

  process.exit(0);
};

// main function
(async () => {
  const blockletDir = process.cwd();
  const meta = parseBlockletMeta(blockletDir, {
    ensureFiles: true,
    schemaOptions: {
      stripUnknown: false,
    },
  });
  await bundle({ meta, blockletDir, userWebpackConfig: 'api/webpack.blocklet.js' });
})();
