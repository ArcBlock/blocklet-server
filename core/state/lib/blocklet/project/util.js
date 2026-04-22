const path = require('path');
const fs = require('fs-extra');
const fg = require('fast-glob');
const { isValid: isValidDid } = require('@arcblock/did');
const { PROJECT, BLOCKLET_RESOURCE_DIR, BLOCKLET_META_FILE } = require('@blocklet/constant');
const { hasHtmlFile } = require('@abtnode/util/lib/upload-component');
const { expandBundle, APP_CONFIG_IMAGE_KEYS } = require('../../util');

const COMPONENT_CONFIG_MAP_DIR = '.component_config';

/**
 * @param {import('@blocklet/server-js').BlockletState} blocklet
 * @param {{
 *  id: string;
 *  blockletLogo?: string;
 * }} project
 */
const getLogoFile = (blocklet, project) => {
  const { id } = project;
  const projectDir = path.join(blocklet.env.dataDir, PROJECT.DIR, id);

  const logoFile = project.blockletLogo
    ? path.join(projectDir, PROJECT.ASSET_DIR, project.blockletLogo)
    : path.join(__dirname, 'logo.png');
  const logoExt = path.extname(logoFile);
  const logoFileName = `logo${logoExt}`;
  return { logoFile, logoFileName };
};

const exportBlockletResources = async ({
  app,
  projectId,
  releaseId,
  exportDir,
  blockletDid,
  isPack,
  selectedComponentDids,
}) => {
  // create resource
  const projectDir = path.join(app.env.dataDir, PROJECT.DIR, `${projectId}`);
  const releaseDir = path.join(projectDir, PROJECT.RELEASE_DIR, `${releaseId}`);
  const sourceDir = path.join(releaseDir, PROJECT.RESOURCE_DIR);

  const resourceDir = path.join(exportDir, BLOCKLET_RESOURCE_DIR);
  await fs.ensureDir(resourceDir);
  await fs.copy(sourceDir, resourceDir);
  await fs.remove(path.join(resourceDir, COMPONENT_CONFIG_MAP_DIR));

  if (isPack) {
    const navigations = app.settings.navigations || [];
    const imagesDir = path.join(exportDir, 'images');

    // 将 tabbar icons 复制到 images 目录
    const bottomNavItems = navigations.filter((item) => item.section === 'bottomNavigation' && item.icon);
    if (bottomNavItems.length > 0) {
      const mediaDir = path.join(app.env.dataDir, 'media', 'blocklet-service');
      if (fs.existsSync(mediaDir)) {
        await fs.ensureDir(imagesDir);

        await Promise.all(
          bottomNavItems.map(async (item) => {
            const iconFileName = path.basename(item.icon);
            const iconFile = path.join(mediaDir, iconFileName);
            if (fs.existsSync(iconFile)) {
              await fs.copy(iconFile, path.join(imagesDir, iconFileName));
            }
          })
        );
      }
    }

    // 将 branding images 复制到 images 目录
    const configObj = app.configObj || {};
    await Promise.all(
      APP_CONFIG_IMAGE_KEYS.map(async (key) => {
        const value = configObj[key];
        if (value && !value.startsWith('http')) {
          const imgFile = path.join(app.env.dataDir, value);
          if (fs.existsSync(imgFile)) {
            await fs.copy(imgFile, path.join(imagesDir, value));
          }
        }
      })
    );

    // create pack resource
    const packResourceDir = path.join(resourceDir, blockletDid, 'config');
    await fs.ensureDir(packResourceDir);
    const site = {
      rules: (app.site?.rules || [])
        .filter((x) => !x.isProtected)
        .map((rule) => ({
          from: rule.from,
          to: rule.to,
        }))
        .filter(Boolean),
    };
    const componentsConfigs = app.children
      .filter((x) => {
        if (selectedComponentDids.length) {
          return selectedComponentDids.includes(x.meta.did);
        }
        return true;
      })
      .map((x) => ({
        did: x.meta.did,
        configs: x.configs.filter((y) => !y.secure),
      }));
    await fs.outputJSON(path.join(packResourceDir, 'config.json'), {
      site,
      configObj,
      navigations,
      components: componentsConfigs,
    });
  }
};

const exportUploadedResources = async ({ app, projectId, releaseId, exportDir }) => {
  const projectDir = path.join(app.env.dataDir, PROJECT.DIR, `${projectId}`);
  const releaseDir = path.join(projectDir, PROJECT.RELEASE_DIR, `${releaseId}`);
  const sourceDir = path.join(releaseDir, PROJECT.RESOURCE_DIR, PROJECT.MAIN_DIR);
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Uploaded resources not found: ${sourceDir}`);
  }
  const destDir = path.join(exportDir, PROJECT.MAIN_DIR);
  await fs.ensureDir(destDir);
  await fs.copy(sourceDir, destDir);
};

async function checkIfDirectory(file) {
  try {
    const stats = await fs.promises.stat(file);
    return stats.isDirectory();
  } catch {
    // maybe file not exists
    return false;
  }
}

const getResourceList = async (resourceDir, { isPublic = true } = {}) => {
  const hasResourceDir = await checkIfDirectory(path.join(resourceDir, BLOCKLET_RESOURCE_DIR));
  const dir = hasResourceDir ? path.join(resourceDir, BLOCKLET_RESOURCE_DIR) : resourceDir;

  const list = await fg(['*/*'], { cwd: dir, onlyDirectories: true });

  return list
    .filter((x) => x !== COMPONENT_CONFIG_MAP_DIR)
    .map((x) => {
      const [did, type] = x.split('/');
      if (!type) {
        throw new Error(`invalid resource: ${x}. type is required`);
      }
      if (!isValidDid(did)) {
        throw new Error(`invalid resource: ${x}. did is invalid`);
      }

      const res = {
        did,
        type,
      };

      if (isPublic) {
        res.public = true;
      }

      return res;
    });
};

const checkResourceExists = async (projectDir, action, releaseId) => {
  const releaseDir =
    action === 'create'
      ? path.join(projectDir, PROJECT.RESOURCE_DIR)
      : path.join(projectDir, PROJECT.RELEASE_DIR, `${releaseId}`, PROJECT.RESOURCE_DIR);

  const configDir = path.join(releaseDir, COMPONENT_CONFIG_MAP_DIR);
  const errMsg = 'resource should not be empty';
  if (!fs.existsSync(configDir)) {
    throw new Error(errMsg);
  }

  const files = await fs.readdir(configDir);
  if (!files.length) {
    throw new Error(errMsg);
  }
};

const checkUploadExists = async (projectDir, action, releaseId, uploadedResource) => {
  const uploadedFile = path.join(projectDir, PROJECT.ASSET_DIR, uploadedResource);
  if (!fs.existsSync(uploadedFile)) {
    throw new Error(`Uploaded resource does not exist: ${uploadedResource}`);
  }

  const resourceDir =
    action === 'create'
      ? path.join(projectDir, PROJECT.RESOURCE_DIR, PROJECT.MAIN_DIR)
      : path.join(projectDir, PROJECT.RELEASE_DIR, `${releaseId}`, PROJECT.RESOURCE_DIR, PROJECT.MAIN_DIR);

  if (fs.existsSync(resourceDir)) {
    fs.rmSync(resourceDir, { recursive: true });
  }
  fs.ensureDirSync(resourceDir);

  try {
    await expandBundle(uploadedFile, resourceDir);
  } catch (err) {
    throw new Error('Only zip or gz archives are supported as resources.');
  }

  if (!hasHtmlFile(resourceDir)) {
    const entries = fs.readdirSync(resourceDir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());
    const files = entries.filter((e) => e.isFile());

    // 如果只有一个文件夹，并且没有文件, 并且文件夹内有 index.html，则使用子文件夹作为根目录
    if (dirs.length === 1 && files.length === 0) {
      const subDir = path.join(resourceDir, dirs[0].name);
      if (hasHtmlFile(subDir)) {
        fs.copySync(subDir, resourceDir, { overwrite: true });
        fs.rmSync(subDir, { recursive: true });
      }
    }
  }

  // 最终再次检查是否有 index.html
  if (!hasHtmlFile(resourceDir)) {
    throw new Error(
      'The uploaded resource does not contain an index.html file in the root directory or its only subdirectory'
    );
  }
};

const getExtendedMetaFile = ({ app, projectId, releaseId }) => {
  const { dataDir } = app.env;
  const dirArr = [dataDir, PROJECT.DIR, projectId || '/'];
  if (releaseId) {
    dirArr.push(PROJECT.RELEASE_DIR, releaseId || '/');
  }
  dirArr.push(BLOCKLET_META_FILE);
  return path.join(...dirArr);
};

module.exports = {
  getLogoFile,
  exportBlockletResources,
  exportUploadedResources,
  getResourceList,
  checkUploadExists,
  checkResourceExists,
  getExtendedMetaFile,
};
