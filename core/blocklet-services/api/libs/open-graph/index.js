// A simple open graph service based on satori and sharp
const fs = require('fs-extra');
const path = require('path');
const { https } = require('follow-redirects');
const sharp = require('sharp');
const { joinURL } = require('ufo');
const { Joi } = require('@arcblock/validator');
const stringify = require('json-stable-stringify');
const md5 = require('@abtnode/util/lib/md5');
const { formatError, CustomError } = require('@blocklet/error');
const { getPassportColor } = require('@abtnode/auth/lib/util/create-passport-svg');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');

const logger = require('../logger')('@abtnode/blocklet-services/og');

const { getTemplate } = require('./template');
const { getCacheFilePath } = require('../image');
const emoji = require('./emoji');

const TEMPLATES = ['default', 'section', 'cover', 'banner'];
const MAX_TITLE_LENGTH = 128;
const MAX_DESCRIPTION_LENGTH = 512;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2400;

const schema = Joi.object({
  template: Joi.string()
    .lowercase()
    .valid(...TEMPLATES)
    .optional()
    .default('default'),

  title: Joi.string()
    .max(MAX_TITLE_LENGTH)
    .trim()
    .when('template', {
      is: 'default',
      then: Joi.optional().default(''),
      otherwise: Joi.required(),
    }),

  description: Joi.string()
    .max(MAX_DESCRIPTION_LENGTH)
    .trim()
    .when('template', {
      is: 'section',
      then: Joi.required(),
      otherwise: Joi.optional().default(''),
    }),

  section: Joi.string()
    .max(64)
    .when('template', {
      is: 'section',
      then: Joi.required(),
      otherwise: Joi.optional().default(''),
    }),

  // customize cover
  cover: Joi.string()
    .uri({ scheme: ['https'] })
    .when('template', {
      is: 'cover',
      then: Joi.required(),
      otherwise: Joi.optional().default(''),
    }),

  // customize logo
  logo: Joi.string()
    .uri({ scheme: ['https'] })
    .when('template', {
      is: 'banner',
      then: Joi.required(),
      otherwise: Joi.optional().default(''),
    }),
  logoRounded: Joi.string().allow('0', '1').optional(),

  // custom emoji
  emoji: Joi.string()
    .valid(...Object.keys(emoji.apis))
    .optional()
    .default('twemoji'),
}).options({ stripUnknown: true, allowUnknown: true, noDefaults: false });

const generateTasks = {};
const getOgImage = ({ input, info, cacheDir, format, tmpDir }) => {
  fs.ensureDirSync(cacheDir);
  fs.ensureDirSync(tmpDir);

  const color = getPassportColor(info.passportColor, info.did);
  const { value, error } = schema.validate(input);
  if (error) {
    throw new CustomError(400, `open graph service params invalid: ${formatError(error)}`);
  }
  if (value.template === 'cover') {
    if (value.title && !value.description) {
      value.description = value.title;
      value.title = info.name;
    }
  }
  if (!value.title) {
    value.title = info.name;
  }
  if (!value.description) {
    value.description = info.description;
  }
  if (!value.logo) {
    value.logo = joinURL(
      info.appUrl,
      WELLKNOWN_SERVICE_PATH_PREFIX,
      `/blocklet/logo?imageFilter=convert&f=png&w=120&hash=${info.logoHash || ''}`
    );
  }

  value.logoRounded = value.logoRounded === '1';
  if (value.template === 'banner') {
    value.background = joinURL(info.appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/static/images/banner.png');
  } else {
    value.background = joinURL(
      info.appUrl,
      WELLKNOWN_SERVICE_PATH_PREFIX,
      `/blocklet/og-image?imageFilter=resize&w=1200&h=630&hash=${info.ogImageHash || ''}`
    );
  }

  const width = value.template === 'banner' ? 1280 : 1200;
  const height = value.template === 'banner' ? 441 : 630;
  const params = { ...value, width, height, color, format };
  const cacheKey = md5(stringify(params));
  const nocache = input.nocache === '1';
  const destPath = getCacheFilePath(cacheDir, `${cacheKey}.${format}`);
  if (!nocache && fs.existsSync(destPath)) {
    return destPath;
  }

  // eslint-disable-next-line no-use-before-define
  generateTasks[cacheKey] ??= generateOgImage(params, tmpDir).finally(() => {
    setTimeout(() => {
      delete generateTasks[cacheKey];
    }, 1000);
  });

  return new Promise((resolve, reject) => {
    generateTasks[cacheKey]
      .then((buffer) => {
        logger.info('open graph generate succeed', { params, destPath });
        fs.writeFileSync(destPath, buffer);
        resolve(destPath);
      })
      .catch((err) => {
        logger.error('open graph generate failed', { error: err, params });
        reject(err);
      });
  });
};

const convertExternalImage = (url, dest, height) => {
  return new Promise((resolve, reject) => {
    const tmp = new URL(url);
    if (!url.endsWith('.svg')) {
      tmp.searchParams.set('imageFilter', 'convert');
      tmp.searchParams.set('f', 'png');
      tmp.searchParams.set('h', height.toString());
    }

    const request = https
      .request(
        {
          hostname: tmp.hostname,
          port: tmp.port,
          path: tmp.pathname + tmp.search,
          method: 'GET',
          headers: { Accept: 'image/*' },
          timeout: 10000,
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new CustomError(400, `unexpected external image status: ${res.statusCode} ${url}`));
            return;
          }

          // Add content length check
          const contentLength = parseInt(res.headers['content-length'] || '0', 10);
          if (contentLength > MAX_IMAGE_SIZE) {
            reject(new CustomError(400, `external image too large: ${url}`));
            return;
          }

          const [type] = (res.headers['content-type'] || '').split('/');
          if (type !== 'image') {
            reject(new CustomError(400, `unexpected external image format: ${type}`));
            return;
          }

          const pipeline = sharp({ animated: false }).timeout({ seconds: 30 });
          pipeline.png({ force: true });

          const out = fs.createWriteStream(dest);
          out.on('close', () => {
            resolve(dest);
          });

          out.on('error', (error) => {
            reject(error);
          });

          res.pipe(pipeline).pipe(out);
        }
      )
      .on('error', reject)
      .on('timeout', () => {
        request?.destroy();
        reject(new CustomError(400, `external image request timeout: ${url}`));
      })
      .end();
  });
};

const getCachedExternalImage = (cacheKey) => {
  return `http://127.0.0.1:${process.env.ABT_NODE_SERVICE_PORT}/open-graph/${cacheKey.slice(0, 2)}/${cacheKey.slice(2)}.png`;
};

const cacheTasks = {};
const ensureExternalImage = (params, key, tmpDir, height) => {
  if (params[key]) {
    const cacheKey = md5(params[key]);
    const destPath = getCacheFilePath(tmpDir, `${cacheKey}.png`);
    if (fs.existsSync(destPath)) {
      return getCachedExternalImage(cacheKey);
    }

    cacheTasks[cacheKey] ??= convertExternalImage(params[key], destPath, height).finally(() => {
      setTimeout(() => {
        delete cacheTasks[cacheKey];
      }, 1000);
    });

    return new Promise((resolve, reject) => {
      cacheTasks[cacheKey]
        .then(() => {
          logger.info('external image convert succeed', { params, destPath });
          resolve(getCachedExternalImage(cacheKey));
        })
        .catch((err) => {
          logger.error('external image convert failed', { error: err, params });
          reject(err);
        });
    });
  }

  return params[key];
};

// ensure external images are processed
const ensureExternalImages = async (params, tmpDir) => {
  await Promise.all(
    ['cover', 'logo', 'background'].map(async (x) => {
      params[x] = await ensureExternalImage(params, x, tmpDir, x === 'logo' ? 120 : 630);
    })
  );
};

const fallbackFont = fs.readFile(path.resolve(__dirname, '../../fonts/noto-sans-sc-regular.otf'));
const generateOgImage = async (params, tmpDir) => {
  const { default: satori } = await import('satori');

  await ensureExternalImages(params, tmpDir);

  const raw = await getTemplate(params);
  if (params.format === 'html') {
    return raw;
  }

  const svg = await satori(raw, {
    width: Math.min(params.width, MAX_IMAGE_DIMENSION),
    height: Math.min(params.height, MAX_IMAGE_DIMENSION),
    // debug: true,
    fonts: [
      {
        name: 'Noto',
        data: await fallbackFont,
        weight: 400,
        style: 'normal',
      },
    ],
    loadAdditionalAsset: emoji.loadDynamicAsset(params.emoji),
  });

  if (params.format === 'svg') {
    return svg;
  }

  return sharp(Buffer.from(svg)).png().toBuffer();
};

module.exports = {
  getOgImage,
  generateOgImage,
  TEMPLATES,
};
