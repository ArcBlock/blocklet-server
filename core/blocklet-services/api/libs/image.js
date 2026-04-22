// A simple image service based on sharp
// @link https://sharp.pixelplumbing.com/
const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const { rmSync } = require('fs');
const sharp = require('sharp');
const toLower = require('lodash/toLower');
const { Joi } = require('@arcblock/validator');
const stringify = require('json-stable-stringify');
const md5 = require('@abtnode/util/lib/md5');
const { formatError, getStatusFromError, CustomError } = require('@blocklet/error');

const logger = require('@abtnode/logger')('@abtnode/blocklet-services/image');

const errorImage = path.resolve(__dirname, './error.svg');

const FORMATS = ['png', 'gif', 'jpeg', 'webp', 'avif', 'heif'];
const OPERATIONS = ['convert', 'resize', 'crop'];
const MODES = ['cover', 'contain', 'fill', 'inside', 'outside'];
const QUALITIES = {
  png: 100,
  jpeg: 80,
  webp: 80,
  avif: 50,
  heif: 50,
};

const EXTENSIONS = {
  png: 'png',
  gif: 'gif',
  jpeg: 'jpeg',
  jpg: 'jpeg',
  webp: 'webp',
  avif: 'avif',
  heif: 'heif',
};

const schema = Joi.object({
  imageFilter: Joi.string()
    .lowercase()
    .valid(...OPERATIONS)
    .required(),

  w: Joi.number().integer().min(1).max(2048).when('imageFilter', {
    is: 'crop',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  h: Joi.number().integer().min(1).max(2048).when('imageFilter', {
    is: 'crop',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  q: Joi.number()
    .integer()
    .min(10)
    .max(100)
    .default((input) => {
      if (input.f && QUALITIES[input.f]) {
        return QUALITIES[input.f];
      }
      return 90;
    }),

  p: Joi.number().valid(0, 1).optional().default(1), // progressive
  g: Joi.number().valid(0, 1).optional().default(0), // greyscale
  r: Joi.number().integer().valid(90, 180, 270).optional(), // rotate
  s: Joi.number().integer().min(0).max(2000).optional(), // sharpen
  b: Joi.number().integer().min(1).max(2000).optional(), // blur
  a: Joi.number().valid(0, 1).optional().default(1), // alpha channel, transparency
  n: Joi.number().valid(0, 1).optional().default(0), // negative

  // image format
  f: Joi.string()
    .lowercase()
    .valid(...FORMATS)
    .when('imageFilter', {
      is: 'convert',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  // resize positions
  m: Joi.string()
    .lowercase()
    .valid(...MODES)
    .optional()
    .default('inside'),

  // crop positions
  t: Joi.number().integer().min(0).max(2048).optional().default(0),
  l: Joi.number().integer().min(0).max(2048).optional().default(0),

  e: Joi.number().valid(0, 1).optional().default(0), // return error
})
  .rename('i', 'p')
  .options({ stripUnknown: true, allowUnknown: true, noDefaults: false });

const isImageAccepted = (req) => {
  return FORMATS.some((x) => req.accepts(`image/${x}`));
};

const getCacheFilePath = (dataDir, fileName) => {
  const result = path.join(dataDir, fileName.substring(0, 2), fileName.substring(2));
  fs.ensureDirSync(path.dirname(result));
  return result;
};

// NOTICE: 如果传入了 fileName，则优先使用 fileName 的 extension，否则使用 req.path 的 extension
const isImageRequest = (req, fileName) => {
  if (req.method !== 'GET') {
    return false;
  }
  // handle `imageFilter=resize&amp;w=320&amp;f=webp`
  if (req.url.includes('&amp;')) {
    req.url = req.url.replace(/&amp;/g, '&');
    const parsed = url.parse(req.url, true);
    req.query = parsed.query;
  }

  if (!req.query.imageFilter) {
    return false;
  }
  const extension = toLower(path.extname(fileName || req.path).slice(1));

  if (extension && !FORMATS.includes(EXTENSIONS[extension])) {
    return false;
  }
  const { error, value } = schema.validate(req.query);
  if (error) {
    logger.warn('image service filter params invalid:', formatError(error));
    return false;
  }

  req.imageFilter = value;
  return true;
};

const getImageContentType = (extension) => (extension === 'svg' ? 'image/svg+xml' : `image/${extension}`);

const processImage = (srcStream, { extension, destPath, srcPath }, filterParams = {}) => {
  return new Promise((resolve, reject) => {
    // output stream
    const out = fs.createWriteStream(destPath);

    try {
      // 这里是双重保障， /.blocklet/service/blocklet/logo 已经在 isImageRequest 中可以过滤掉了
      // 此处只是为了增加健壮性，一般情况下不会到这里
      if (extension && !FORMATS.includes(EXTENSIONS[extension])) {
        // 如果是不支持的 extension，则将源文件直接写入目标地址
        srcStream.pipe(out);
        return;
      }

      out.on('close', () => {
        resolve(destPath);
      });

      out.on('error', (err) => {
        reject(err);
      });

      const {
        imageFilter,
        w: width,
        h: height,
        t: top,
        l: left,
        q: quality,
        f: format,
        m: mode,
        r: rotate,
        p: progressive,
        g: greyscale,
        b: blur,
        a: transparency,
        n: negative,
        s: sharpen,
      } = filterParams;

      const dimensions = { top, left };
      if (width) {
        dimensions.width = width;
      }
      if (height) {
        dimensions.height = height;
      }

      const pipeline = sharp({ animated: true, limitInputPixels: 0 }).timeout({ seconds: 60 });
      if (rotate) {
        pipeline.rotate(rotate);
      }
      if (imageFilter === 'resize') {
        if (!dimensions.width && !dimensions.height) {
          reject(new CustomError(400, 'At least one of `w` or `h` must be provided to resize'));
          return;
        }
      }
      if (dimensions.width || dimensions.height) {
        pipeline.resize({ ...dimensions, fit: mode, withoutEnlargement: true });
      }
      if (imageFilter === 'crop') {
        pipeline.extract(dimensions);
      }

      if (sharpen) {
        pipeline.sharpen(sharpen);
      }
      if (blur) {
        pipeline.blur(blur);
      }
      if (greyscale) {
        pipeline.greyscale();
      }
      if (transparency) {
        pipeline.ensureAlpha();
      } else {
        pipeline.removeAlpha();
      }
      if (negative) {
        pipeline.negate();
      }

      const processFn = pipeline[format || EXTENSIONS[extension]];
      // 如果 sharp 实例中不包含目标 extension 的转换方法，则将源文件直接写入目标地址
      if (!processFn || processFn instanceof Function === false) {
        srcStream.pipe(out);
        return;
      }

      // HACK: 这里不能使用 processFn 来替代，会导致图片处理出错(猜测是 this 指针的问题)
      pipeline[format || EXTENSIONS[extension]]({ quality, progressive: !!progressive, dither: 0, force: true });

      pipeline.on('error', (err) => {
        reject(err);
      });

      // run the pipeline
      srcStream.pipe(pipeline).pipe(out);
    } catch (err) {
      logger.error('image filter failed', {
        error: err,
        filterParams,
        srcPath,
        destPath,
        extension,
      });
      srcStream.pipe(out);
    }
  }).catch((err) => {
    rmSync(destPath, { force: true });
    throw err;
  });
};

const tasks = {};
const processAndRespond = (
  req,
  res,
  {
    srcPath,
    cacheDir,
    getSrc,
    extension: ext,
    sendOptions = {
      maxAge: '356d',
      immutable: true,
    },
  }
) => {
  if (fs.existsSync(cacheDir) === false) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const params = req.imageFilter;
  const extension = toLower(ext || path.extname(req.path).slice(1));

  // NOTE: 不要使用 `req.accepts('image/webp')`，这里需要排除掉 `Accept: */*` 和 `Accept: image/*` 的情况
  const acceptWebp = req.accepts().includes('image/webp');
  if (!acceptWebp) {
    if (params.f === 'webp') {
      params.f = undefined;
    }
    if ((!extension || extension === 'webp') && !params.f) {
      params.f = 'png';
    }
  }
  if (!extension && !params.f) {
    params.f = 'png';
  }

  if (!extension && !params.f) {
    res.status(400).send('Image filter failed: either extension or format must be specified');
    return;
  }

  const cacheKey = md5(stringify({ target: req.target, path: req.originalUrl, params }));
  const destPath = getCacheFilePath(cacheDir, `${cacheKey}.${params.f || extension}`);

  if (fs.existsSync(destPath)) {
    res.header('Content-Type', getImageContentType(params.f || extension));
    res.sendFile(destPath, sendOptions);
    return;
  }

  // do the convert
  tasks[cacheKey] ??= getSrc(req)
    .then(([src, _extension]) =>
      processImage(
        src,
        {
          extension: toLower(_extension),
          destPath,
          srcPath,
        },
        params
      )
    )
    .finally(() => {
      setTimeout(() => {
        delete tasks[cacheKey];
      }, 1000);
    });

  tasks[cacheKey]
    .then(() => {
      logger.info('image filter succeed', { params, url: req.originalUrl, destPath });
      res.header('Content-Type', getImageContentType(params.f || extension));
      res.sendFile(destPath, sendOptions);
    })
    .catch((err) => {
      logger.error('image filter failed', { error: err, params, url: req.url });
      const status = ['unsupported image format', 'has corrupt header'].some((message) =>
        err.message?.includes(message)
      )
        ? 400
        : getStatusFromError(err);
      if (params.e) {
        res.status(status).send(`Image service error: ${err.message}`);
      } else {
        res.status(status);
        res.sendFile(errorImage, { maxAge: 0 });
      }
    });
};

module.exports = {
  isImageAccepted,
  isImageRequest,
  processAndRespond,
  processImage,
  getCacheFilePath,
  EXTENSIONS,
  MODES,
};
