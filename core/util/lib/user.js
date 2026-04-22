const path = require('path');
const fs = require('fs-extra');
const { joinURL } = require('ufo');

const {
  USER_AVATAR_DIR,
  WELLKNOWN_SERVICE_PATH_PREFIX,
  USER_AVATAR_PATH_PREFIX,
  USER_AVATAR_URL_PREFIX,
} = require('@abtnode/constant');

const md5 = require('./md5');
const axios = require('./axios');
const cloneDeep = require('./deep-clone');

const getAvatarFile = (dataDir, fileName) => {
  const result = path.join(dataDir, USER_AVATAR_DIR, fileName.substring(0, 2), fileName.substring(2));
  return result;
};

const getServerAvatarUrl = (baseUrl, info) => {
  if (!baseUrl) {
    return '';
  }

  let origin = baseUrl;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    // Do nothing;
  }

  return joinURL(
    origin,
    process.env.NODE_ENV === 'production' ? info.routing.adminPath : '',
    `/images/node.png?v=${info.version}`
  );
};

const getAppAvatarUrl = (baseUrl, size = 80) => {
  if (!baseUrl) {
    return '';
  }

  let origin = baseUrl;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    // Do nothing;
  }

  return joinURL(origin, WELLKNOWN_SERVICE_PATH_PREFIX, `/blocklet/logo?imageFilter=convert&f=png&h=${size}`);
};

const getUserAvatarUrl = (baseUrl, avatar, info = {}, isServer = false) => {
  if (!avatar) {
    return '';
  }

  if (avatar.startsWith('https://') || avatar.startsWith('http://')) {
    return avatar;
  }

  if (!avatar.startsWith(USER_AVATAR_URL_PREFIX)) {
    throw new Error('User avatar is not persisted on disk');
  }

  const filename = avatar.split('/').pop();

  let origin = baseUrl;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    // Do nothing;
  }

  if (isServer) {
    const prefix = process.env.NODE_ENV !== 'development' ? info.routing.adminPath : '';
    return joinURL(origin, prefix, USER_AVATAR_PATH_PREFIX, info.did, filename);
  }

  return joinURL(
    origin,
    WELLKNOWN_SERVICE_PATH_PREFIX,
    USER_AVATAR_PATH_PREFIX,
    `${filename}?imageFilter=resize&w=48&h=48`
  );
};

/**
 * save base64 avatar data to storage and return url
 */
const extractUserAvatar = async (avatar, { dataDir } = {}) => {
  if (!avatar) {
    return avatar;
  }

  const regex = /^data:image\/(\w+);base64,/;
  const match = regex.exec(avatar);

  if (!match) {
    return avatar;
  }

  const fileData = Buffer.from(avatar.replace(regex, ''), 'base64');
  const fileName = `${md5(fileData)}.${match[1]}`;

  const avatarFile = getAvatarFile(dataDir, fileName);
  await fs.outputFile(avatarFile, fileData);

  const url = `${USER_AVATAR_URL_PREFIX}/${fileName}`;

  return url;
};

const convertImageToBase64 = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const contentType = response.headers['content-type'] || 'image/png';
  const buffer = Buffer.from(response.data, 'binary');
  const base64 = buffer.toString('base64');
  return `data:${contentType};base64,${base64}`;
};

/**
 * generate base64 avatar data to from file by url
 */
const parseUserAvatar = async (avatar, { dataDir } = {}) => {
  if (!avatar) {
    return avatar;
  }

  if (!avatar.startsWith(USER_AVATAR_URL_PREFIX)) {
    return avatar;
  }

  const fileName = avatar.split('/').slice(-1)[0];

  const avatarFile = getAvatarFile(dataDir, fileName);

  if (!fs.existsSync(avatarFile)) {
    return avatar;
  }

  const buf = await fs.promises.readFile(avatarFile);
  const extname = path.extname(fileName).substring(1);

  const data = `data:image/${extname};base64,${buf.toString('base64')}`;

  return data;
};

/**
 * Update the linked third-party account
 * @param {import('@abtnode/types').TConnectedAccount[]} connectedAccounts
 * @param {import('@abtnode/types').TConnectedAccount} connectedAccount
 * @returns
 */
function updateConnectedAccount(connectedAccounts = [], connectedAccount = {}) {
  const now = new Date().toISOString();
  const accounts = connectedAccounts.filter(Boolean);
  const updated = cloneDeep(accounts);
  const updates = Array.isArray(connectedAccount) ? connectedAccount : [connectedAccount];
  updates.filter(Boolean).forEach((x) => {
    if (x.provider && x.did) {
      // When inserting into the connectedAccount table, the did field is used as the key; only did equality needs to be checked
      const index = updated.findIndex((item) => item.did === x.did);
      if (index > -1) {
        updated[index] = {
          ...accounts[index],
          ...x,
          lastLoginAt: now,
        };
        // HACK: the provider of a linked account must not be changed; restore it to the original value
        updated[index].provider = accounts[index].provider || x.provider;
      } else {
        updated.push({
          firstLoginAt: now,
          ...x,
          lastLoginAt: now,
        });
      }
    }
  });

  return updated;
}

const getAvatarByUrl = async (url) => {
  if (url.startsWith('bn:')) {
    return url;
  }

  try {
    const { data } = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    const base64Content = Buffer.from(data, 'binary').toString('base64');

    return `data:image/png;base64,${base64Content}`;
  } catch (error) {
    console.error(`Fetch avatar failed: ${url}`, error);
    throw error;
  }
};

// HACK: even when passed an empty value, returns the md5 of an empty string
const getEmailHash = (email) => md5(email?.trim()?.toLowerCase() || '');

const getAvatarByEmail = async (email) => {
  try {
    const emailHash = getEmailHash(email);
    const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}`;
    const avatarBase64 = await getAvatarByUrl(gravatarUrl);
    return avatarBase64;
  } catch (error) {
    console.error(`Fetch gravatar failed: ${email}`, error);
    return null;
  }
};

module.exports = {
  extractUserAvatar,
  parseUserAvatar,
  getAvatarFile,
  updateConnectedAccount,
  getAvatarByUrl,
  getAvatarByEmail,
  getEmailHash,
  getUserAvatarUrl,
  getAppAvatarUrl,
  getServerAvatarUrl,
  convertImageToBase64,
};
