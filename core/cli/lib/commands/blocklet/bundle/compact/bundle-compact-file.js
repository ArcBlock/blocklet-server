const ncc = require('@vercel/ncc');
const fs = require('fs-extra');
const { dirname, resolve } = require('path');
const convertToNoSourcesSourceMap = require('../../../../util/convert-to-nosources-sourcemap');

async function bundleCompactFile({
  srcPath,
  distDir,
  enterFile,
  sourceMap,
  nosourcesSourceMap,
  externals,
  minify = true,
}) {
  const { code, assets } = await ncc(resolve(srcPath, enterFile), {
    sourceMap: sourceMap || nosourcesSourceMap,
    externals,
    minify,
    quiet: true,
    cache: false,
    sourceMapBasePrefix: '',
  });

  const codeFile = resolve(distDir, enterFile);
  const outDir = dirname(codeFile);
  if (!fs.existsSync(dirname(codeFile))) {
    fs.mkdirSync(dirname(codeFile), { recursive: true });
  }

  fs.writeFileSync(codeFile, code);

  Object.keys(assets).forEach((name) => {
    const distDirByFile = dirname(resolve(outDir, name));
    if (!fs.existsSync(distDirByFile)) {
      fs.mkdirSync(distDirByFile, { recursive: true });
    }
    fs.writeFileSync(resolve(outDir, name), assets[name].source);
  });

  if (!sourceMap && nosourcesSourceMap) {
    const mapFilePath = resolve(distDir, 'index.js.map');
    await convertToNoSourcesSourceMap(mapFilePath, mapFilePath);
  }
}

module.exports = {
  bundleCompactFile,
};
