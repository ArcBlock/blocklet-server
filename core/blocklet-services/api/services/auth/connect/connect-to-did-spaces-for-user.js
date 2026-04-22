const { getAppUrl, getAppName, getAppDescription } = require('@blocklet/meta/lib/util');
const { Joi } = require('@arcblock/validator');
const { messages } = require('@abtnode/auth/lib/auth');
const { getDidSpacesInfoByClaims, silentAuthorizationInConnect } = require('@abtnode/auth/lib/util/spaces');
const { DID_SPACES } = require('@blocklet/constant');
const { formatError } = require('@blocklet/error');
const logger = require('../../../libs/logger')(require('../../../../package.json').name);

const ExtraParamsSchema = Joi.object({
  referrer: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  componentDid: Joi.DID().optional(),
  purpose: Joi.string()
    .valid('authorize-for-full-access', 'authorize-for-import')
    .optional()
    .allow('')
    .default('authorize-for-full-access'),
});

/**
 * @description
 * @param {{
 *  node: any,
 *  blocklet: import('@blocklet/server-js').BlockletState,
 *  claims: any[],
 *  challenge: any,
 *  updateSession: Function,
 *  extraParams: Record<string, any>,
 *  userDid: string,
 * }} {
 *   node,
 *   blocklet,
 *   claims,
 *   challenge,
 *   updateSession,
 *   extraParams: { locale, referrer },
 *   userDid,
 * }
 */
async function handleOnAuthForFullAccess({
  node,
  blocklet,
  claims,
  challenge,
  updateSession,
  extraParams: { locale, referrer },
  userDid,
}) {
  const appUrl = getAppUrl(blocklet);
  const teamDid = blocklet.appPid;
  const didSpaceInfo = await getDidSpacesInfoByClaims({ claims });

  const { data } = await silentAuthorizationInConnect(didSpaceInfo, {
    appInfo: {
      appDid: blocklet.appDid,
      appName: getAppName(blocklet),
      appDescription: getAppDescription(blocklet),
      appUrl,
      scopes: DID_SPACES.AUTHORIZE.DEFAULT_SCOPE,
      referrer,
      metadata: {
        did: blocklet.meta.did,
      },
    },
    verifyNFTParams: {
      claims,
      challenge,
      locale,
    },
  });

  /**
   * @type {Omit<import('@blocklet/server-js').SpaceGatewayInput, 'protected'>}
   */
  const spaceGateway = {
    did: data.did,
    name: data.name,
    endpoint: data.endpoint,
    url: didSpaceInfo.didSpacesCoreUrl,
  };

  // 两边都要做同样的校验
  await updateSession({ spaceGateway, ...data }, true);

  const user = await node.getUser({
    teamDid,
    user: {
      did: userDid,
    },
    options: {
      enableConnectedAccount: true,
    },
  });

  await node.updateUser({
    teamDid,
    user: {
      did: user.did,
      didSpace: {
        ...user?.didSpace,
        ...spaceGateway,
      },
    },
  });
}

/**
 * @description
 * @param {{
 *  node: any,
 *  blocklet: import('@blocklet/server-js').BlockletState,
 *  claims: any[],
 *  challenge: any,
 *  updateSession: Function,
 *  extraParams: Record<string, any>,
 *  userDid: string,
 * }} {
 *   node,
 *   blocklet,
 *   claims,
 *   challenge,
 *   updateSession,
 *   extraParams: { locale, referrer },
 *   userDid,
 * }
 */
async function handleOnAuthForImport({
  blocklet,
  claims,
  challenge,
  updateSession,
  extraParams: { locale, purpose, referrer },
  componentDid,
}) {
  const appUrl = getAppUrl(blocklet);
  const didSpaceInfo = await getDidSpacesInfoByClaims({ claims });

  /**
   * @type {{
   *  data: {
   *    did: string,
   *    name: string,
   *    endpoint: string,
   *    url: string,
   *    canImport?: false | true,
   *    importUrl?: string,
   *  }
   * }}
   */
  const { data } = await silentAuthorizationInConnect(didSpaceInfo, {
    // 本次 authorize 是为了导入实例的组件数据
    purpose,
    componentDid,
    appInfo: {
      appDid: blocklet.appDid,
      appName: getAppName(blocklet),
      appDescription: getAppDescription(blocklet),
      appUrl,
      scopes: DID_SPACES.AUTHORIZE.DEFAULT_SCOPE,
      referrer,
      metadata: {
        did: blocklet.meta.did,
      },
    },
    verifyNFTParams: {
      claims,
      challenge,
      locale,
    },
  });

  if (!data.canImport) {
    throw new Error(messages.cannotImportFromDidSpace({ spaceName: data.name })[locale]);
  }

  /**
   * @type {Omit<import('@blocklet/server-js').SpaceGatewayInput, 'protected'>}
   */
  const spaceGateway = {
    did: data.did,
    name: data.name,
    endpoint: data.endpoint,
    url: didSpaceInfo.didSpacesCoreUrl,
  };

  // 两边都要做同样的校验
  await updateSession({ spaceGateway, ...data }, true);

  return null;
}

/**
 * @description
 * @param {import('@abtnode/core').TNode} node
 * @return {*}
 */
function createConnectToDidSpacesForUserRoute(node) {
  return {
    action: 'connect-to-did-spaces-for-user',
    onStart: ({ extraParams }) => {
      const { error, value } = ExtraParamsSchema.validate(extraParams, {
        allowUnknown: true,
      });
      if (error) {
        throw new Error(error);
      }

      // eslint-disable-next-line no-param-reassign
      extraParams = {
        ...extraParams,
        ...value,
      };
    },

    onConnect: ({ extraParams: { locale } }) => {
      return {
        assetOrVC: {
          description: messages.requestDidSpace[locale],
          optional: false,
          filters: [
            {
              tag: DID_SPACES.NFT_TAG, // 用于筛选 NFT
            },
            {
              type: DID_SPACES.VC_TYPES, // 用于筛选 VC
            },
          ],
          meta: {
            purpose: 'DidSpace',
          },
        },
      };
    },

    onAuth: async ({ userDid, claims, challenge, extraParams, updateSession, request }) => {
      const { purpose } = extraParams;
      /** @type {import('@blocklet/server-js').BlockletState} */
      const blocklet = await request.getBlocklet();

      const existsConnectSpaceClaim = claims.some(
        (x) => x?.meta?.purpose === 'DidSpace' && ['asset', 'verifiableCredential'].includes(x.type)
      );

      if (!existsConnectSpaceClaim) {
        logger.error('Unable to find claim for DID Spaces', { claims });
        throw new Error('Unable to find claim for DID Spaces');
      }

      try {
        if (purpose === 'authorize-for-import') {
          // @NOTE: 注意,我们不能使用 x-blocklet-did 获取当前的 componentDid, 而应该使用 x-blocklet-component-id(很坑的一个点就是 x-blocklet-component-id 在开发模式下等于 componentDid)
          const [, componentDid] = request.headers['x-blocklet-component-id'].split('/');

          return await handleOnAuthForImport({
            blocklet,
            claims,
            challenge,
            updateSession,
            extraParams,
            componentDid,
          });
        }

        return await handleOnAuthForFullAccess({
          node,
          blocklet,
          claims,
          challenge,
          updateSession,
          extraParams,
          userDid,
        });
      } catch (err) {
        logger.error('Failed to connect to DID Spaces', err);
        throw new Error(formatError(err));
      }
    },
  };
}

module.exports = { createConnectToDidSpacesForUserRoute };
