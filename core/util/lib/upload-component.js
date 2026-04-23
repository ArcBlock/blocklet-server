const path = require('path');
const fs = require('fs-extra');
const { types } = require('@ocap/mcrypto');
const { fromRandom } = require('@ocap/wallet');
const { update: updateMetaFile, read: readMetaFile } = require('@blocklet/meta/lib/file');
const {
  BLOCKLET_GROUPS,
  BLOCKLET_LATEST_SPEC_VERSION,
  BLOCKLET_DEFAULT_VERSION,
  BLOCKLET_META_FILE,
  BLOCKLET_RELEASE_FOLDER_NAME,
  BLOCKLET_BUNDLE_FOLDER_NAME,
  BLOCKLET_RELEASE_FILE,
} = require('@blocklet/constant');
const { MAX_UPLOAD_FILE_SIZE } = require('@abtnode/constant');
const { safeTarExtract } = require('./safe-tar');
const { zipToDir } = require('./zip');

const { createRelease } = require('./create-blocklet-release');

const TEMP_DIR_NAME = 'blocklet-upload-tmp';
const HTML_MIME_TYPE = 'text/html';
const GZIP_MIME_TYPE = 'application/gzip';
const ZIP_MIME_TYPE = 'application/zip';
const ALLOW_UPLOAD_MIME_TYPES = [HTML_MIME_TYPE, GZIP_MIME_TYPE, ZIP_MIME_TYPE];

const maxUploadSize = Number(process.env.MAX_UPLOAD_FILE_SIZE) || MAX_UPLOAD_FILE_SIZE;

const hasHtmlFile = (dir) => {
  const files = ['index.html', 'index.htm'];
  return files.some((file) => fs.existsSync(path.join(dir, file)));
};

/**
 * Recursively check whether specified files exist in a directory
 * Search the current level first, then recurse into subdirectories (outer files take priority)
 * @param {string} dir - the directory path to scan
 * @param {string[]} filenames - array of filenames to look for
 * @param {string} rootDir - root directory for computing relative paths
 * @param {number} maxDepth - maximum search depth, default 5
 * @param {number} currentDepth - current recursion depth, default 0
 * @returns {Promise<Object>} map of found files {filename: relativePath}
 */
const checkFileExist = async (dir, filenames = [], rootDir = null, maxDepth = 5, currentDepth = 0) => {
  if (!dir || !filenames.length) return {};

  const baseDir = rootDir || dir;
  const result = {};

  try {
    // read current directory contents
    const files = await fs.readdir(dir);

    // get file stats sequentially to avoid parallel operation issues
    const stats = [];
    // eslint-disable-next-line no-await-in-loop
    for (const file of files) {
      const fullPath = path.join(dir, file);
      // eslint-disable-next-line no-await-in-loop
      const stat = await fs.stat(fullPath);
      stats.push({ file, fullPath, stat });
    }

    // search for files at the current level first
    for (const { file, fullPath, stat } of stats) {
      if (!stat.isDirectory() && filenames.includes(file)) {
        result[file] = path.relative(baseDir, fullPath);
      }
    }

    // for files not yet found, recurse into subdirectories (up to max depth)
    const remainingFiles = filenames.filter((name) => !result[name]);
    if (remainingFiles.length > 0 && currentDepth < maxDepth) {
      for (const { fullPath, stat } of stats) {
        if (stat.isDirectory()) {
          // recurse serially to ensure ordered operations; pass depth info
          // eslint-disable-next-line no-await-in-loop
          const found = await checkFileExist(fullPath, remainingFiles, baseDir, maxDepth, currentDepth + 1);
          // only add files not already found (preserves outer-level priority)
          Object.keys(found).forEach((key) => {
            if (!result[key]) {
              result[key] = found[key];
            }
          });
        }
      }
    }

    return result;
  } catch (error) {
    return {};
  }
};

/**
 * Compute the entry root directory from the index.html path
 * @param {string} filePath - relative path of index.html
 * @returns {string} root directory path of the entry file
 */
const getEntryFilePath = (filePath) => {
  if (
    !filePath ||
    !filePath.startsWith(`${BLOCKLET_BUNDLE_FOLDER_NAME}/`) ||
    !filePath.endsWith('index.html') ||
    !filePath.endsWith('index.html')
  ) {
    return '.';
  }

  // extract the path after bundle/
  const afterBundle = filePath.split(`${BLOCKLET_BUNDLE_FOLDER_NAME}/`)[1];
  if (!afterBundle) {
    return '.';
  }

  // get directory path (without filename)
  const dirPath = path.dirname(afterBundle);
  return dirPath === '.' ? '.' : dirPath;
};

/**
 * Normalize bundle directory structure
 * If extraction produces a single folder that is not bundle, rename it to bundle
 * @param {string} tempDir - temporary directory
 */
const normalizeBundleStructure = async (tempDir) => {
  const allContents = await fs.readdir(tempDir);
  // filter hidden files
  const visibleContents = allContents.filter((item) => !item.startsWith('.'));

  if (visibleContents.length === 1) {
    const itemPath = path.join(tempDir, visibleContents[0]);
    const stat = await fs.stat(itemPath);

    if (stat.isDirectory() && visibleContents[0] !== BLOCKLET_BUNDLE_FOLDER_NAME) {
      const bundlePath = path.join(tempDir, BLOCKLET_BUNDLE_FOLDER_NAME);
      await fs.move(itemPath, bundlePath);
    }
  }
};

/**
 * Handle archive files (.gz or .zip)
 * @param {string} srcFile - source file path
 * @param {string} mimetype - file type
 * @param {string} tempDir - temporary directory
 * @param {string} destDir - destination directory
 * @returns {Promise<string>} relative path of index.html
 */
const handleArchiveFile = async (srcFile, mimetype, tempDir, destDir) => {
  // empty temporary directory
  await fs.emptyDir(tempDir);

  try {
    // extract based on file type
    if (mimetype === GZIP_MIME_TYPE) {
      await safeTarExtract({ file: srcFile, cwd: tempDir });
    } else if (mimetype === ZIP_MIME_TYPE) {
      await zipToDir(srcFile, tempDir);
    }
  } catch (err) {
    throw new Error('Only zip or gz archives are supported as resources.');
  }
  // handle extracted directory structure
  await normalizeBundleStructure(tempDir);

  // check required files
  const foundFiles = await checkFileExist(tempDir, ['blocklet.yml', 'index.html', 'index.htm']);
  if (!foundFiles['blocklet.yml'] && !foundFiles['index.html'] && !foundFiles['index.htm']) {
    throw new Error('Unable to parse the uploaded file, missing blocklet.yml or index.html or index.htm');
  }

  // copy files to destination directory
  await fs.copy(tempDir, destDir);

  // if this is not a blocklet project, return index.html path
  return foundFiles['blocklet.yml'] ? '' : foundFiles['index.html'] || foundFiles['index.htm'];
};

/**
 * Handle HTML files
 * @param {string} srcFile - source file path
 * @param {string} destDir - destination directory
 */
const handleHtmlFile = async (srcFile, destDir) => {
  const bundleDir = path.join(destDir, BLOCKLET_BUNDLE_FOLDER_NAME);
  await fs.ensureDir(bundleDir);
  await fs.copy(srcFile, path.join(bundleDir, 'index.html'));
};

/**
 * Generate blocklet metadata file
 * @param {string} destDir - destination directory
 * @param {string} baseName - base name
 * @param {string} indexPath - index.html path
 * @param {Object} user - user object
 */
const generateBlockletMeta = async (destDir, baseName, indexPath, user) => {
  // generate metadata only when needed (HTML file or indexPath exists)
  if (!indexPath && (await fs.pathExists(path.join(destDir, BLOCKLET_BUNDLE_FOLDER_NAME, BLOCKLET_META_FILE)))) {
    return; // blocklet.yml already exists, no need to generate
  }

  const randomWallet = fromRandom({ role: types.RoleType.ROLE_BLOCKLET });
  const meta = {
    name: randomWallet.address,
    title: baseName.slice(0, 40),
    description: `${baseName} (uploaded)`,
    group: BLOCKLET_GROUPS[1], // static
    publicUrl: '/',
    main: !indexPath ? '.' : getEntryFilePath(indexPath),
    author: user?.fullName || user?.email || 'Blocklet',
    specVersion: BLOCKLET_LATEST_SPEC_VERSION,
    version: BLOCKLET_DEFAULT_VERSION,
    logo: 'logo.png',
    did: randomWallet.address,
    interfaces: [
      {
        type: 'web',
        name: 'publicUrl',
        path: '/',
        prefix: '*',
        port: 'BLOCKLET_PORT',
        protocol: 'http',
        proxyBehavior: 'service',
      },
    ],
    capabilities: {
      navigation: false,
    },
  };

  const metaPath = path.join(destDir, BLOCKLET_BUNDLE_FOLDER_NAME, BLOCKLET_META_FILE);
  await updateMetaFile(metaPath, meta);
};

/**
 * Clean up temporary files
 * @param {string} srcFile - source file path
 * @param {string} tempDir - temporary directory path
 */
const cleanup = async (srcFile, tempDir) => {
  try {
    // delete serially to ensure operations complete
    if (await fs.pathExists(srcFile)) {
      await fs.remove(srcFile);
    }
    if (await fs.pathExists(tempDir)) {
      await fs.emptyDir(tempDir);
    }
  } catch (error) {
    // cleanup failure does not affect the main flow; only log the error
    console.warn('Failed to clean up temporary files:', error.message);
  }
};

/**
 * Core file upload handling logic
 * @param {Object} node - node object
 * @param {Object} uploadMetadata - uploaded file metadata
 * @param {Object} blocklet - Blocklet object
 * @param {Object} user - user object
 * @returns {Promise<Object>} processing result
 */
const onUploadComponent = async (node, uploadMetadata, blocklet, user) => {
  const {
    id: filename,
    size,
    metadata: { filename: originalname, filetype: mimetype },
  } = uploadMetadata;

  const srcFile = path.join(node.dataDirs.tmp, filename);

  // verify file existence
  if (!(await fs.pathExists(srcFile))) {
    throw new Error(`File not found: ${filename}`);
  }

  // verify file type
  if (!ALLOW_UPLOAD_MIME_TYPES.includes(mimetype)) {
    throw new Error(`Unsupported file type: ${mimetype}`);
  }

  // verify file size
  if (size > maxUploadSize * 1024 * 1024) {
    throw new Error(`File size exceeds the limit: ${maxUploadSize}MB`);
  }

  // initialize directory structure
  const tempDir = path.join(node.dataDirs.tmp, TEMP_DIR_NAME);
  const baseName = path.parse(originalname).name;
  const destDir = path.join(blocklet.env.dataDir, 'components', baseName);

  await fs.ensureDir(tempDir);
  await fs.ensureDir(destDir);

  let indexPath = '';

  try {
    // extract or copy based on file type
    if (mimetype === GZIP_MIME_TYPE || mimetype === ZIP_MIME_TYPE) {
      indexPath = await handleArchiveFile(srcFile, mimetype, tempDir, destDir);
    } else if (mimetype === HTML_MIME_TYPE) {
      await handleHtmlFile(srcFile, destDir);
    }

    // generate blocklet metadata
    await generateBlockletMeta(destDir, baseName, indexPath, user);

    // create release package
    const release = await createRelease(destDir);

    // clean up temporary files
    // FIXME: the upload component verifies file existence after upload completes; cleaning up immediately would show an upload failure on the frontend, so a short delay before cleanup is needed
    setTimeout(() => {
      cleanup(srcFile, tempDir);
    }, 5000);

    const releaseDir = path.join(destDir, BLOCKLET_RELEASE_FOLDER_NAME);
    return {
      filename,
      size,
      originalname,
      mimetype,
      meta: release.meta,
      inputUrl: `file://${path.join(releaseDir, BLOCKLET_RELEASE_FILE)}`,
    };
  } catch (error) {
    // clean up temporary files on error
    cleanup(srcFile, tempDir);
    throw error;
  }
};

/**
 * Update component DID for overwriting uploaded content
 * @param {string} url - package URL (file:// blocklet.json URL)
 * @param {string} did - DID to update
 * @returns {Promise<Object>} updated metadata
 */
const updateComponentDid = async (url, did) => {
  if (!url.startsWith('file://')) {
    throw new Error('URL must start with file://');
  }

  // locate bundle directory from blocklet.json path
  const releaseDir = path.dirname(url.replace('file://', ''));
  const bundlePath = path.join(releaseDir, '..', BLOCKLET_BUNDLE_FOLDER_NAME);
  const blockletYmlPath = path.join(bundlePath, BLOCKLET_META_FILE);

  // run serially: read -> update -> write -> repackage
  const existingMeta = await readMetaFile(blockletYmlPath);
  if (existingMeta.did !== did) {
    existingMeta.did = did;
    await updateMetaFile(blockletYmlPath, existingMeta);

    // recreate release package
    const release = await createRelease(path.join(bundlePath, '..'));
    return release.meta;
  }
  return existingMeta;
};

/**
 * Remove uploaded files
 * @param {string} url - package URL (file:// blocklet.json URL)
 * @param {string} tempDir - temporary directory path
 */
const removeUploadFile = async (url) => {
  if (!url.startsWith('file://')) {
    throw new Error('URL must start with file://');
  }

  try {
    const releaseDir = path.dirname(url.replace('file://', ''));
    // get uploaded folder
    const componentDir = path.dirname(releaseDir, '..');
    // do not delete if the target file is outside the current blocklet server directory
    if (componentDir && process.env.ABT_NODE_DATA_DIR && !componentDir.includes(process.env.ABT_NODE_DATA_DIR)) {
      return;
    }
    // check whether the folder exists before deleting
    if (await fs.pathExists(componentDir)) {
      await fs.remove(componentDir);
    }
  } catch (error) {
    console.error('removeUploadFile failed', { error });
    throw error;
  }
};

module.exports = {
  checkFileExist,
  TEMP_DIR_NAME,
  onUploadComponent,
  updateComponentDid,
  removeUploadFile,
  hasHtmlFile,
};
