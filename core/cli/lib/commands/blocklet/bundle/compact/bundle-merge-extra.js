const fs = require('fs-extra');
const path = require('path');
const pAll = require('p-all');
const { bundleCompactFile } = require('./bundle-compact-file');
const { parseExternalDependencies } = require('../parse-external-dependencies');

const compactFileName = 'blocklet-compact.js';

async function bundleMergeExtra({
  extraFiles,
  srcPath,
  distDir,
  sourceMap,
  nosourcesSourceMap,
  enterFile,
  externals,
  externalManager,
  minify,
  dependenciesDepth = 9,
}) {
  const entryFiles = [...extraFiles, enterFile];

  const compactCode = `
module.exports = {
  ${entryFiles.map((file) => `'${file}':()=> require('${path.resolve(srcPath, file)}'),`).join('\n')}
};
  `;

  if (!fs.existsSync(distDir)) {
    fs.mkdirpSync(distDir);
  }
  fs.writeFileSync(path.resolve(distDir, compactFileName), compactCode);
  await bundleCompactFile({
    minify,
    externals,
    srcPath: distDir,
    distDir,
    enterFile: compactFileName,
    sourceMap,
    nosourcesSourceMap,
  });

  const promises = entryFiles.map((file) => {
    return async () => {
      const distDirByFile = path.dirname(path.resolve(distDir, file));
      try {
        await fs.access(distDirByFile);
      } catch (err) {
        await fs.mkdir(distDirByFile, { recursive: true });
      }
      let relativePath = path.relative(distDirByFile, path.resolve(distDir, compactFileName));
      if (relativePath.startsWith('blocklet-compact.js')) {
        relativePath = `./${relativePath}`;
      }
      await fs.writeFile(path.resolve(distDir, file), `module.exports = require('${relativePath}')['${file}']();`);
    };
  });
  await pAll(promises, { concurrency: 4 });

  parseExternalDependencies({ externals, distDir, externalManager, dependenciesDepth });
}

module.exports = {
  bundleMergeExtra,
};
