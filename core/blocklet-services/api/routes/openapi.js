const fs = require('fs-extra');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { BLOCKLET_OPEN_API_FILE, BLOCKLET_OPEN_API_FILE_JSON } = require('@blocklet/constant');
const pMap = require('p-map');
const YAML = require('yaml');
const { joinURL } = require('ufo');
const { fromPublicKey } = require('@ocap/wallet');
const { types, Hasher } = require('@ocap/mcrypto');

const { api } = require('../libs/api');
const verifyDid = require('../middlewares/verify-did');

async function getOpenAPIJSON(appDir) {
  const openAPIFileYAML = joinURL(appDir, BLOCKLET_OPEN_API_FILE);
  const openAPIFileJSON = joinURL(appDir, BLOCKLET_OPEN_API_FILE_JSON);
  const [existYAML, existJSON] = await Promise.all([fs.exists(openAPIFileYAML), fs.exists(openAPIFileJSON)]);

  if (existYAML) {
    const openAPIData = await fs.readFile(openAPIFileYAML, 'utf8');
    return YAML.parse(openAPIData);
  }
  if (existJSON) {
    const openAPIData = await fs.readFile(openAPIFileJSON, 'utf8');
    return JSON.parse(openAPIData);
  }
  return null;
}

async function getComponentOpenAPIData(component) {
  const { mountPoint } = component;
  const appDir = component?.env?.appDir;
  const { title, description, did } = component?.meta || {};

  const openAPIJSON = await getOpenAPIJSON(appDir);
  if (!openAPIJSON) {
    return null;
  }

  // 将当前的 api 分组到 component 相关的 tag 中
  openAPIJSON.tags = [{ name: title, description }];

  const mergedPrefixPaths = {};
  Object.keys(openAPIJSON.paths).forEach((pathname) => {
    const mergedPathname = joinURL(mountPoint, pathname);
    const pathItem = openAPIJSON.paths[pathname];
    Object.keys(pathItem).forEach((method) => {
      const operation = pathItem[method];
      operation.tags = [title];
      const walletPk = Hasher.SHA3.hash256(JSON.stringify(['openapi', did, pathname, method]));
      const operationWallet = fromPublicKey(walletPk, {
        role: types.RoleType.ROLE_ANY,
      });
      operation['x-id'] = operationWallet.address;
      operation['x-did'] = did;
      operation['x-path'] = pathname;
      operation['x-method'] = method;
    });
    mergedPrefixPaths[mergedPathname] = pathItem;
  });
  openAPIJSON.paths = mergedPrefixPaths;
  return openAPIJSON;
}

function mergeOpenAPI(dataList, { blocklet }) {
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
    openapi: '3.1.0',
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

async function generateOpenAPIData({ blocklet, did }) {
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
      const result = getComponentOpenAPIData(findComponent, { baseUrl: appUrl });
      return result;
    }
    return null;
  }
  // 多个 component 组合
  const componentListData = await pMap(runningComponents, (x) => getComponentOpenAPIData(x, { baseUrl: appUrl }));
  const result = mergeOpenAPI(componentListData, { blocklet });
  return result;
}

module.exports = {
  // eslint-disable-next-line no-unused-vars
  init(app, node, options) {
    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/openapi.yml`, verifyDid, async (req, res) => {
      const { did } = req.query;
      const blocklet = await req.getBlocklet({ useCache: false });
      const data = await generateOpenAPIData({ blocklet, did });
      const ymlData = YAML.stringify(data);
      res.setHeader('Content-Disposition', 'attachment; filename="openapi.yml"');
      res.status(200).send(ymlData);
    });

    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/openapi.json`, verifyDid, async (req, res) => {
      const { did } = req.query;
      const blocklet = await req.getBlocklet({ useCache: false });
      const data = await generateOpenAPIData({ blocklet, did });
      res.status(200).json(data);
    });
  },
};
