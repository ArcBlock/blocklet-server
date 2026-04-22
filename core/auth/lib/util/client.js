const { getChainClient } = require('@abtnode/util/lib/get-chain-client');
const { MAIN_CHAIN_ENDPOINT } = require('@abtnode/constant');
const { getBlockletChainInfo } = require('@blocklet/meta/lib/util');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { toStakeAddress } = require('@arcblock/did-util');
const { sign } = require('@arcblock/jwt');
const { toBN, fromUnitToToken } = require('@ocap/util');
const { toTxHash } = require('@ocap/mcrypto');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');

const logger = require('../logger');

async function declareAccountByChain({ chainHost, wallet }) {
  const chainClient = getChainClient(chainHost);
  const { address } = wallet;
  const { state } = await chainClient.getAccountState({ address }, { ignoreFields: ['context'] });
  if (state) {
    logger.info('skip declare account on chain done', { chain: chainHost, did: address });
  } else {
    logger.warn('declare account on chain deprecated', { chain: chainHost, did: address });
  }
}

async function declareAccount({ wallet, blocklet }) {
  const chainHostList = [MAIN_CHAIN_ENDPOINT];
  // 本质上是获取环境变量为 CHAIN_HOST 的值
  const { host: chainHost } = getBlockletChainInfo(blocklet);
  if (chainHost && chainHost !== 'none') {
    chainHostList.push(chainHost);
  }
  const waitingList = [...new Set(chainHostList)].map((item) => declareAccountByChain({ chainHost: item, wallet }));
  await Promise.all(waitingList);
}

async function migrateAccountByChain({ chainHost, user, wallet, blocklet }) {
  const client = getChainClient(chainHost);

  // Do not migrate if target account already exists
  const { state: exist } = await client.getAccountState({ address: user.did });
  if (exist) {
    logger.info('migrate account on chain done', { chain: chainHost, did: user.did });
    return '';
  }

  // Ensure staked for gas
  const info = getBlockletInfo(blocklet);
  await ensureStakedForGas({ client, chainHost, wallet: info.wallet });

  // send migrate tx with app as gas payer
  const tx = await client.signAccountMigrateTx({
    tx: {
      itx: {
        address: user.did,
        pk: user.pk,
        data: {
          type: 'json',
          value: {
            purpose: 'connect-wallet',
          },
        },
      },
    },
    wallet,
  });
  const { buffer } = await client.encodeAccountMigrateTx({ tx, wallet });
  const hash = await client.sendAccountMigrateTx(
    { tx, wallet },
    {
      headers: {
        'x-gas-payer-sig': await sign(info.wallet.address, info.wallet.secretKey, { txHash: toTxHash(buffer) }),
        'x-gas-payer-pk': info.wallet.publicKey,
      },
    }
  );

  logger.info('migration account done', { chain: chainHost, did: user.did, hash });
  return hash;
}

async function migrateAccount({ wallet, blocklet, user }) {
  const chainHostList = [MAIN_CHAIN_ENDPOINT];
  const { host: chainHost } = getBlockletChainInfo(blocklet);
  if (chainHost && chainHost !== 'none') {
    chainHostList.push(chainHost);
  }
  const waitingList = [...new Set(chainHostList)].map((item) =>
    migrateAccountByChain({ chainHost: item, wallet, user, blocklet })
  );
  await Promise.all(waitingList);
}

async function ensureStakedForGas({ client, chainHost, wallet }) {
  // check if already staked
  const address = toStakeAddress(wallet.address, wallet.address);
  const { state: stake } = await client.getStakeState({ address });
  if (stake) {
    return;
  }

  // try stake for gas if we have enough balance
  const { state: account } = await client.getAccountState({ address: wallet.address });
  const result = await client.getForgeState({});
  const { token, txConfig } = result.state;
  const holding = (account?.tokens || []).find((x) => x.address === token.address);
  if (toBN(holding?.value || '0').lte(toBN(txConfig.txGas.minStake))) {
    logger.warn('app do not have enough balance to stake for gas on chain', {
      chain: chainHost,
      address: wallet.address,
    });
    return;
  }

  // @ts-ignore
  const [hash] = await client.stake({
    to: wallet.address,
    message: 'stake-for-gas',
    tokens: [{ address: token.address, value: fromUnitToToken(txConfig.txGas.minStake, token.decimal) }],
    wallet,
  });
  logger.info(`App staked for gas on chain ${chainHost}`, { hash });
}

async function getJWK(kid, jwksUri) {
  const client = jwksClient({
    cache: true,
    jwksUri,
  });
  const key = await new Promise((resolve, reject) => {
    client.getSigningKey(kid, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
  return {
    publicKey: key.getPublicKey(),
    kid: key.kid,
    alg: key.alg,
  };
}

/**
 * Verify the authenticity of a token by decoding, verifying the algorithm, and matching claims.
 * @author https://github.com/stefanprokopdev/verify-apple-id-token
 * @param {Object} params - Object containing idToken, jwksUri, nonce, iss, clientId
 * @param {string} params.idToken - JWT token
 * @param {string} params.jwksUri - JWK set URI
 * @param {string} params.nonce - Nonce
 * @param {string} params.iss - Issuer
 * @param {string} params.clientId - Client ID
 * @return {Object} Decoded JWT claims if token is valid
 */
async function verifyIdToken(params) {
  const decoded = jwt.decode(params.idToken, { complete: true });
  const { kid, alg: jwtAlg } = decoded.header;

  const { publicKey, alg: jwkAlg } = await getJWK(kid, params.jwksUri);

  if (jwtAlg !== jwkAlg) {
    throw new Error(`The alg does not match the jwk configuration - alg: ${jwtAlg} | expected: ${jwkAlg}`);
  }

  const jwtClaims = jwt.verify(params.idToken, publicKey, {
    algorithms: [jwkAlg],
    nonce: params.nonce,
  });

  if (jwtClaims?.iss !== params.iss) {
    throw new Error(`The iss does not match the Apple URL - iss: ${jwtClaims.iss} | expected: ${params.iss}`);
  }

  const isFounded = [].concat(jwtClaims.aud).some((aud) => [].concat(params.clientId).includes(aud));

  if (isFounded) {
    ['email_verified', 'is_private_email'].forEach((field) => {
      if (jwtClaims[field] !== undefined) {
        jwtClaims[field] = Boolean(jwtClaims[field]);
      }
    });

    return jwtClaims;
  }

  throw new Error(
    `The aud parameter does not include this client - is: ${jwtClaims.aud} | expected: ${params.clientId}`
  );
}

module.exports = {
  declareAccount,
  migrateAccount,
  verifyIdToken,
};
