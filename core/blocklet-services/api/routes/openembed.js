const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { BLOCKLET_OPENEMBED_PREFIX } = require('@blocklet/constant');
const { formatError } = require('@blocklet/error');
const pMap = require('p-map');
const YAML = require('yaml');
const { joinURL, withQuery, withLeadingSlash, withoutTrailingSlash } = require('ufo');
const { types, Hasher } = require('@ocap/mcrypto');
const { hasStartEngine, findWebInterfacePort } = require('@blocklet/meta/lib/util');
const { fromPublicKey } = require('@ocap/wallet');

const { api } = require('../libs/api');
const verifyDid = require('../middlewares/verify-did');

async function getComponentOpenEmbedData(component) {
  const port = findWebInterfacePort(component) || component?.environmentObj?.BLOCKLET_PORT;
  // NOTICE: 此处更倾向于使用本地地址，这也能达到更快的速度
  const url = joinURL(`http://127.0.0.1:${port}`, BLOCKLET_OPENEMBED_PREFIX);
  try {
    // eslint-disable-next-line prefer-const
    let { data: result, headers } = await api.get(url);
    if (!headers?.['x-blocklet-openembed']) {
      return null;
    }

    try {
      if (typeof result === 'string') {
        result = JSON.parse(result);
      }
    } catch (err) {
      console.error('openembed.json parse error', formatError(err));
      return null;
    }

    const { mountPoint } = component;
    const { title, description, did } = component?.meta || {};

    // // 将当前的分组到 component 相关的 tag 中
    result.tags = [{ name: title, description }];

    const mergedPrefixEmbeds = {};
    Object.keys(result.embeds).forEach((pathname) => {
      const mergedPathname = joinURL(mountPoint, pathname);
      const pathItem = result.embeds[pathname];
      pathItem.tags = [title];
      const walletPk = Hasher.SHA3.hash256(JSON.stringify(['openembed', did, pathname]));
      const itemWallet = fromPublicKey(walletPk, {
        role: types.RoleType.ROLE_ANY,
      });
      pathItem['x-meta'] = {
        id: itemWallet.address,
        did,
        path: pathname,
        version: result?.info?.version,
        prefix: withoutTrailingSlash(withLeadingSlash(mountPoint)),
      };
      mergedPrefixEmbeds[mergedPathname] = pathItem;
    });
    result.embeds = mergedPrefixEmbeds;
    return result;
  } catch (err) {
    console.error('openembed.json fetch error', formatError(err));
    return null;
  }
}

async function mergeOpenEmbed(dataList, { blocklet, node }) {
  const { title, description, version } = blocklet.meta || {};
  const filteredDataList = dataList.filter(Boolean);
  const embeds = {};
  const tags = [];
  const owner = blocklet?.settings?.owner;
  let contact;
  if (owner?.did) {
    try {
      const user = await node.getUser({ teamDid: blocklet.meta.did, user: { did: owner.did } });
      if (user) {
        contact = {
          email: user.email,
          name: user.fullName,
          url: withQuery(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, 'user'), {
            did: owner.did,
          }),
        };
      }
    } catch {
      console.error('Failed to get owner info');
    }
  }
  filteredDataList.forEach((x) => {
    tags.push(...x.tags);
    Object.keys(x.embeds).forEach((pathItem) => {
      const embedItem = x.embeds[pathItem];
      if (embedItem) {
        embeds[pathItem] = embedItem;
      }
    });
  });
  return {
    openembed: '0.1.0',
    info: {
      title,
      description,
      contact,
      version,
    },
    tags,
    embeds,
  };
}

async function generateOpenEmbedData({ blocklet, did, node }) {
  const blockletComponents = blocklet?.children || [];
  const appUrl = blocklet?.environmentObj?.BLOCKLET_APP_URL;
  const healthCheckUrl = joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/health');
  const { data: healthCheckData } = await api.get(healthCheckUrl);
  const runningComponents = blockletComponents.filter((x) => {
    const status = healthCheckData.components?.[x.meta.did];
    return hasStartEngine(x?.meta) && status?.running === true;
  });
  // 单个 component
  if (did) {
    const findComponent = runningComponents.find((component) => component?.meta?.did === did);
    if (findComponent) {
      const result = getComponentOpenEmbedData(findComponent, { baseUrl: appUrl });
      return result;
    }
    return null;
  }
  // 多个 component 组合
  const componentListData = await pMap(runningComponents, (x) => getComponentOpenEmbedData(x, { baseUrl: appUrl }), {
    concurrency: 3,
    stopOnError: false,
  });
  const result = await mergeOpenEmbed(componentListData, { blocklet, node });
  return result;
}

module.exports = {
  // eslint-disable-next-line no-unused-vars
  init(app, node, options) {
    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/openembed.yaml`, verifyDid, async (req, res) => {
      const { did } = req.query;
      const blocklet = await req.getBlocklet({ useCache: false });
      const data = await generateOpenEmbedData({ blocklet, did, node });
      const ymlData = YAML.stringify(data);
      res.setHeader('Content-Disposition', 'attachment; filename="openembed.yml"');
      res.status(200).send(ymlData);
    });

    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/openembed.json`, verifyDid, async (req, res) => {
      const { did } = req.query;
      const blocklet = await req.getBlocklet({ useCache: false });

      const data = await generateOpenEmbedData({ blocklet, did, node });
      res.status(200).json(data);
    });
  },
};
