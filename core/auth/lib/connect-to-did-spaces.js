const { getAppUrl, getAppName, getAppDescription } = require('@blocklet/meta/lib/util');
const { Joi } = require('@arcblock/validator');
const { DID_SPACES } = require('@blocklet/constant');
const { formatError } = require('@blocklet/error');
const logger = require('./logger');
const { messages } = require('./auth');
const { getDidSpacesInfoByClaims, silentAuthorizationInConnect } = require('./util/spaces');

const ExtraParamsSchema = Joi.object({
  referrer: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  appPid: Joi.DID().optional(),
});

/**
 * @description
 * @param {import('@abtnode/core').TNode} node
 * @return {*}
 */
function createConnectToDidSpacesRoute(node) {
  return {
    action: 'connect-to-did-spaces',
    onStart: ({ extraParams }) => {
      const { error } = ExtraParamsSchema.validate(extraParams, {
        allowUnknown: true,
      });
      if (error) {
        throw new Error(error.message);
      }
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

    onAuth: async ({ claims, challenge, extraParams: { appPid, locale, referrer }, updateSession, request }) => {
      try {
        /** @type {import('@blocklet/server-js').BlockletState} */
        const blocklet = request.getBlocklet ? await request.getBlocklet() : await node.getBlocklet({ did: appPid });

        const existsConnectSpaceClaim = claims.some(
          (x) => x?.meta?.purpose === 'DidSpace' && ['asset', 'verifiableCredential'].includes(x.type)
        );

        if (!existsConnectSpaceClaim) {
          logger.error('Unable to find claim for DID Spaces', { claims });
          throw new Error('Unable to find claim for DID Spaces');
        }

        const didSpaceInfo = await getDidSpacesInfoByClaims({ claims });
        const appUrl = getAppUrl(blocklet);
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
      } catch (error) {
        logger.error('Failed to connect to DID Spaces', error);
        throw new Error(formatError(error));
      }
    },
  };
}

module.exports = { createConnectToDidSpacesRoute };
