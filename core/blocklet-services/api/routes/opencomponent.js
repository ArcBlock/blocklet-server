const fs = require('fs-extra');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { BLOCKLET_OPEN_COMPONENT_FILE, BLOCKLET_OPEN_COMPONENT_FILE_JSON } = require('@blocklet/constant');
const pMap = require('p-map');
const YAML = require('yaml');
const { joinURL } = require('ufo');
const { types, Hasher } = require('@ocap/mcrypto');
const { fromPublicKey } = require('@ocap/wallet');

const { api } = require('../libs/api');
const verifyDid = require('../middlewares/verify-did');

async function getOpenComponentJSON(appDir) {
  const fileYAML = joinURL(appDir, BLOCKLET_OPEN_COMPONENT_FILE);
  const fileJSON = joinURL(appDir, BLOCKLET_OPEN_COMPONENT_FILE_JSON);
  const [existYAML, existJSON] = await Promise.all([fs.exists(fileYAML), fs.exists(fileJSON)]);

  if (existYAML) {
    const data = await fs.readFile(fileYAML, 'utf8');
    return YAML.parse(data);
  }
  if (existJSON) {
    const data = await fs.readFile(fileJSON, 'utf8');
    return JSON.parse(data);
  }
  return null;
}

async function getComponentOpenComponentData(component) {
  const { mountPoint } = component;
  const appDir = component?.env?.appDir;
  const { title, description, did } = component?.meta || {};

  const jsonData = await getOpenComponentJSON(appDir);
  if (!jsonData) {
    return null;
  }

  // 将当前的分组到 component 相关的 tag 中
  jsonData.tags = [{ name: title, description }];

  const mergedPrefixPaths = {};
  Object.keys(jsonData.paths).forEach((pathname) => {
    const mergedPathname = joinURL(mountPoint, pathname);
    const pathItem = jsonData.paths[pathname];
    pathItem.tags = [title];
    const walletPk = Hasher.SHA3.hash256(JSON.stringify(['opencomponent', did, pathname]));
    const itemWallet = fromPublicKey(walletPk, {
      role: types.RoleType.ROLE_ANY,
    });
    pathItem['x-id'] = itemWallet.address;
    pathItem['x-did'] = did;
    pathItem['x-path'] = pathname;
    mergedPrefixPaths[mergedPathname] = pathItem;
  });
  jsonData.paths = mergedPrefixPaths;
  return jsonData;
}

function mergeOpenComponent(dataList, { blocklet }) {
  const { title, description, version } = blocklet.meta || {};
  const filteredDataList = dataList.filter(Boolean);
  const paths = {};
  const tags = [];
  filteredDataList.forEach((x) => {
    tags.push(...x.tags);
    Object.keys(x.paths).forEach((pathItem) => {
      const operation = x.paths[pathItem];
      if (operation) {
        paths[pathItem] = operation;
      }
    });
  });
  return {
    opencomponent: '0.1.0',
    info: {
      title,
      description,
      // FIXME: 需要在 blocklet dashboard 中增加联系人信息配置
      // contact: {
      //   email: 'blocklet@arcblock.io',
      // },
      version,
    },
    tags,
    paths,
  };
}

async function generateOpenComponentData({ blocklet, did }) {
  const blockletComponents = blocklet?.children || [];
  const appUrl = blocklet?.environmentObj?.BLOCKLET_APP_URL;
  const healthCheckUrl = joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/health');
  const { data: healthCheckData } = await api.get(healthCheckUrl);
  const runningComponents = blockletComponents.filter((x) => {
    const status = healthCheckData.components?.[x.meta.did];
    return status?.running === true;
  });
  // 单个 component
  if (did) {
    const findComponent = runningComponents.find((component) => component?.meta?.did === did);
    if (findComponent) {
      const result = getComponentOpenComponentData(findComponent, { baseUrl: appUrl });
      return result;
    }
    return null;
  }
  // 多个 component 组合
  const componentListData = await pMap(runningComponents, (x) => getComponentOpenComponentData(x, { baseUrl: appUrl }));
  const result = mergeOpenComponent(componentListData, { blocklet });
  return result;
}

module.exports = {
  // eslint-disable-next-line no-unused-vars
  init(app, node, options) {
    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/opencomponent.yml`, verifyDid, async (req, res) => {
      const { did } = req.query;
      const blocklet = await req.getBlocklet({ useCache: false });
      const data = await generateOpenComponentData({ blocklet, did });
      const ymlData = YAML.stringify(data);
      res.setHeader('Content-Disposition', 'attachment; filename="opencomponent.yml"');
      res.status(200).send(ymlData);
    });

    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/opencomponent.json`, verifyDid, async (req, res) => {
      const { did } = req.query;
      const blocklet = await req.getBlocklet({ useCache: false });
      const data = await generateOpenComponentData({ blocklet, did });
      res.status(200).json(data);
    });
  },
};
