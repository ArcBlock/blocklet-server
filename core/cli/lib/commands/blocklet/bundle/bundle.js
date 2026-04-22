const os = require('os');
const path = require('path');
const packList = require('npm-packlist');
const chalk = require('chalk');
const uniq = require('lodash/uniq');
const pick = require('lodash/pick');
const merge = require('lodash/merge');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const fs = require('fs-extra');
const fg = require('fast-glob');
const isGlob = require('is-glob');
const { list: metaFiles, select: getMetaFile, update: updateMetaFile } = require('@blocklet/meta/lib/file');
const {
  BLOCKLET_BUNDLE_FOLDER,
  BLOCKLET_ENTRY_FILE,
  BLOCKLET_BUNDLE_FILE,
  BLOCKLET_OPEN_API_FILE,
  BLOCKLET_OPEN_API_FILE_JSON,
  BLOCKLET_OPEN_COMPONENT_FILE,
  BLOCKLET_OPEN_COMPONENT_FILE_JSON,
  BLOCKLET_RESOURCE_DIR,
} = require('@blocklet/constant');
const formatBackSlash = require('@abtnode/util/lib/format-back-slash');
const { getGitHash, printInfo } = require('../../../util');
const SimpleBundler = require('./bundlers/simple');
const { parseExternalDependencies } = require('./parse-external-dependencies');

const createBlockletEntry = (blockletDir, entryFile) => {
  const packageFile = path.join(blockletDir, 'package.json');
  const hasPackageFile = fs.existsSync(packageFile);
  const tempEntryFile = formatBackSlash(`./${path.normalize(entryFile)}`);
  if (hasPackageFile) {
    const packageJson = JSON.parse(fs.readFileSync(packageFile).toString());
    if (packageJson.type === 'module') {
      return `import '${tempEntryFile}';${os.EOL}`;
    }
  }

  return `require('${tempEntryFile}');${os.EOL}`;
};

const PACKAGE_JSON_KEYS = [
  'name',
  'version',
  'type',
  'description',
  'keywords',
  'author',
  'repository',
  'bugs',
  'publishConfig',
];

const createBlockletBundle = async ({
  blockletDir,
  meta,
  updates = {},
  inMonoRepo = false,
  withChangeLog = true,
  externals = [],
  compact = false,
  dependenciesDepth = 9,
}) => {
  // After adding glob support to meta.files, all glob-matched files must also be copied into the bundle
  const metaFileList = meta.files || [];
  const distDir = path.join(blockletDir, BLOCKLET_BUNDLE_FOLDER);

  let files = [
    `!${path.dirname(BLOCKLET_BUNDLE_FOLDER)}`,
    ...metaFiles,
    BLOCKLET_BUNDLE_FILE,
    BLOCKLET_ENTRY_FILE,
    BLOCKLET_OPEN_API_FILE,
    BLOCKLET_OPEN_API_FILE_JSON,
    BLOCKLET_OPEN_COMPONENT_FILE,
    BLOCKLET_OPEN_COMPONENT_FILE_JSON,
    BLOCKLET_RESOURCE_DIR,
    'LICENSE',
    meta.group === 'static' ? meta.main : '',
    ...metaFileList,
  ].filter(Boolean);

  // #5823, always include the entire main folder for dapps
  if (meta.group === 'dapp' && !compact) {
    const mainPath = path.join(blockletDir, meta.main);
    const hasMainFile = fs.statSync(mainPath).isFile();
    if (hasMainFile) {
      if (path.dirname(mainPath) !== blockletDir) {
        files.unshift(path.dirname(meta.main));
      }
    }
  }

  files = uniq(files);

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }

  // https://docs.npmjs.com/cli/v9/configuring-npm/package-json#files
  const selected = await packList({ package: { files } }, { path: blockletDir });

  // Filter out development and build directories that should never be bundled
  // npm-packlist doesn't properly handle negation patterns (!.blocklet) when combined with '.'
  const EXCLUDED_DIRS = [
    path.dirname(BLOCKLET_BUNDLE_FOLDER), // .blocklet - prevents recursive inclusion
    '.docker-output', // Docker build artifacts
    '.home', // Development home directory
    '.claude', // Claude Code settings
    '.cursor', // Cursor editor settings
    '.vscode', // VSCode settings
    '.idea', // JetBrains IDE settings
    '.aigne', // Aigne settings
    '.github', // GitHub settings
  ];

  const filtered = selected.filter((fileName) => {
    // Check if file is in any excluded directory
    return !EXCLUDED_DIRS.some((dir) => fileName === dir || fileName.startsWith(dir + path.sep));
  });

  filtered.forEach((fileName) => {
    const source = path.join(blockletDir, fileName);
    const target = path.join(distDir, fileName);
    if (fs.existsSync(source) && !fs.existsSync(target)) {
      fs.copySync(source, target);
    }
  });

  await new SimpleBundler({ blockletDir, inMonoRepo, withChangeLog, meta }).bundle();

  // Update blocklet meta file in the bundle
  try {
    updates.gitHash = getGitHash(blockletDir);
  } catch (err) {
    // Do nothing
  }

  const metaToUpdate = getMetaFile(path.join(distDir));
  const rawMeta = cloneDeep(meta);
  updateMetaFile(metaToUpdate, Object.assign(rawMeta, updates));

  // Rewrite the package.json file if exist
  const packageFile = path.join(blockletDir, 'package.json');
  const hasPackageFile = fs.existsSync(packageFile);
  if (hasPackageFile) {
    const json = JSON.parse(fs.readFileSync(packageFile).toString());
    const result = parseExternalDependencies({
      externals,
      distDir,
      persist: false,
      dependenciesDepth,
    });

    fs.writeFileSync(
      path.join(distDir, 'package.json'),
      JSON.stringify(merge(pick(json, PACKAGE_JSON_KEYS), result), null, 2)
    );
  }
  return selected;
};

/**
 * Get all extraFiles. In theory, all .js files must be found here in order to subsequently resolve their dependencies.
 * @param {Object} meta blocklet meta
 * @returns Array
 */
const getExtraFiles = (blockletDir, meta) => {
  const { files = [], scripts = {} } = meta;
  const fileList = [];
  for (const file of files) {
    if (isGlob(file)) {
      const entries = fg.sync(file, { cwd: blockletDir, absolute: false });
      fileList.push(...entries);
    } else {
      const filePath = path.join(blockletDir, file);
      const fileStat = fs.lstatSync(filePath);
      if (fileStat.isFile() && path.extname(filePath) === '.js') {
        fileList.push(file);
      }
    }
  }

  Object.entries(scripts).forEach(([key, script]) => {
    if (key.startsWith('pre') || key.startsWith('post')) {
      [script]
        .concat(script.split(' ').filter(Boolean))
        .filter((x) => path.extname(x) === '.js')
        .forEach((x) => {
          const filePath = path.join(blockletDir, x);
          if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
            printInfo(`Extra script file detected for bundling ${chalk.cyan(x)}`);
            fileList.push(x);
          }
        });
    }
  });

  // add migration scripts
  const migrationScripts = fg.sync('migration/*.js', { cwd: blockletDir, absolute: false });
  fileList.push(...migrationScripts);
  migrationScripts.forEach((x) => printInfo(`Extra migration file detected for bundling ${chalk.cyan(x)}`));

  return uniq([...fileList]).filter((x) => x !== BLOCKLET_ENTRY_FILE);
};

module.exports = { createBlockletBundle, createBlockletEntry, getExtraFiles };
