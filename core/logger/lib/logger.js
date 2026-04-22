const fs = require('fs-extra');
const path = require('node:path');
const morgan = require('morgan');
const dayjs = require('@abtnode/util/lib/dayjs');
const isEmpty = require('lodash.isempty');
const safeStringify = require('fast-safe-stringify').default;
const { createLogger, format, transports } = require('winston');
const debug = require('debug');
const rfs = require('rotating-file-stream');
require('@abtnode/winston-daily-rotate-file');
const { LOG_RETAIN_IN_DAYS } = require('@abtnode/constant');
const CustomRotateFileTransport = require('./transport');
const { getAccessLogFilenameGenerator } = require('./util');

if (!process.env.ABT_NODE_LOG_NAME) {
  process.env.ABT_NODE_LOG_NAME = 'daemon';
}

/**
 * @typedef {import('prettier').LiteralUnion<'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly', string>} LoggerLabel
 */

/** @type {Map<LoggerLabel, import('winston').Logger>} */
const instanceMap = new Map();

const getNoopLogger = (label = '') => {
  if (process.env.DEBUG) {
    const d = debug(label);
    return {
      error: d,
      warn: d,
      info: d,
      verbose: d,
      debug: d,
      silly: d,
    };
  }

  return {
    error: () => {},
    warn: () => {},
    info: () => {},
    verbose: () => {},
    debug: () => {},
    silly: () => {},
  };
};

// singleton per process
let addedRejectionExceptionTransport = false;

// splat is intentionally unused here; the splat array unexpectedly contains all metadata
const customPrintfCallback = ({ level, message, label, timestamp, [Symbol.for('splat')]: metadata }) => {
  let result = `[${process.pid}] [${timestamp}] [${level}] [${label || 'default'}] [${message || ''}]`;

  let newMetadata = metadata;
  if (!isEmpty(newMetadata)) {
    newMetadata = newMetadata.map((d) => {
      if (d instanceof Error) {
        return {
          error: d.message,
          error_stack: d.stack,
        };
      }

      if (d?.error) {
        d.error = {
          error: d.error.message,
          error_stack: d.error.stack,
        };
        return d;
      }

      return d;
    });

    result = `${result} ${safeStringify(newMetadata)}`;
  }

  return result;
};

const initLogger =
  (label = '') =>
  ({
    logDir = process.env.ABT_NODE_LOG_DIR,
    filename = process.env.ABT_NODE_LOG_NAME,
    retain,
    level = process.env.ABT_NODE_LOG_LEVEL,
  } = {}) => {
    if (!logDir) {
      return getNoopLogger(label);
    }

    const logger = createLogger({
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ssZ' }),
        format.label({ label }),
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
        format.printf(customPrintfCallback)
      ),
    });

    const logToFile = () => {
      logger.level = level || 'info';
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const rotateConfig = {
        datePattern: 'YYYY-MM-DD',
        dirname: logDir,
        zippedArchive: true,
        createSymlink: true,
        maxSize: '20m',
      };

      const infoAuditFilename = `.${filename}-info.audit.json`;
      const errorAuditFilename = `.${filename}-error.audit.json`;

      const infoRotateFileParams = {
        ...rotateConfig,
        filename: `${filename}-%DATE%.log`,
        ignoreLevels: ['error'],
        symlinkName: `${filename}.log`,
        auditFile: path.join(logDir, infoAuditFilename),
      };

      const errorRotateFileParams = {
        ...rotateConfig,
        filename: `${filename}-error-%DATE%.log`,
        symlinkName: `${filename}-error.log`,
        auditFile: path.join(logDir, errorAuditFilename),
        level: 'error',
      };

      if (typeof retain === 'number') {
        infoRotateFileParams.maxFiles = retain;
        errorRotateFileParams.maxFiles = retain;
      }

      logger.add(new transports.DailyRotateFile(errorRotateFileParams));
      logger.add(new CustomRotateFileTransport(infoRotateFileParams));

      if (!addedRejectionExceptionTransport) {
        logger.rejections.handle(
          new transports.File({
            filename: path.join(logDir, 'stderr.log'),
          })
        );

        logger.exceptions.handle(
          new transports.File({
            filename: path.join(logDir, 'stderr.log'),
          })
        );

        addedRejectionExceptionTransport = true;
      }
    };

    const logToConsole = () => {
      logger.level = level || 'debug';
      const transport = new transports.Console({
        format: format.combine(format.colorize({ all: true })),
      });

      logger.add(transport);

      if (!addedRejectionExceptionTransport) {
        logger.rejections.handle(transport);
        logger.exceptions.handle(transport);
        addedRejectionExceptionTransport = true;
      }
    };

    if (process.env.ABT_LOG_TO_FILE === 'true') {
      logToFile();
      logToConsole();
    } else if (process.env.NODE_ENV === 'production') {
      logToFile();
    } else {
      logToConsole();
    }

    return logger;
  };

/**
 * @description
 * @param {LoggerLabel} [label='']
 * @param {any} [options={}]
 * @return {import('winston').Logger}
 */
const getLogger = (label = '', options = {}) => {
  if (!instanceMap.has(label)) {
    instanceMap.set(label, initLogger(label)({ retain: LOG_RETAIN_IN_DAYS, ...options }));
  }

  return instanceMap.get(label);
};

const deleteOldLogfiles = (file, retain) => {
  if (typeof retain !== 'number') {
    return;
  }

  if (file === '/dev/null') {
    return;
  }

  const extname = path.extname(file);
  const fileBaseName = `${path.basename(file, extname)}`;
  const dirName = path.dirname(file);
  const files = fs.readdirSync(dirName);
  let i;
  let len;
  const rotatedFiles = [];
  for (i = 0, len = files.length; i < len; i++) {
    if (files[i].startsWith(`${fileBaseName}-`)) {
      rotatedFiles.push(files[i]);
    }
  }

  rotatedFiles.sort().reverse();

  for (i = rotatedFiles.length - 1; i >= retain; i--) {
    fs.truncateSync(path.resolve(dirName, rotatedFiles[i]), 0);
    fs.rmSync(path.resolve(dirName, rotatedFiles[i]), { force: true });
  }
};

const getAccessLogStream = (dir, filename = 'access.log') => {
  const stream = rfs.createStream(getAccessLogFilenameGenerator(filename), {
    interval: '1d',
    path: dir,
    compress: 'gzip',
  });

  stream.on('rotated', () => {
    deleteOldLogfiles(path.join(dir, filename), LOG_RETAIN_IN_DAYS);
  });

  return stream;
};

const setupAccessLogger = (app, stream, upstream = false, { prefix = '' } = {}) => {
  morgan.token(
    'real_ip',
    (req) =>
      req.headers['x-real-ip'] ||
      req.ip ||
      req._remoteAddress ||
      (req.connection && req.connection.remoteAddress) ||
      '-'
  );
  morgan.token('request_id', (req) => req.headers['x-request-id'] || '-');
  morgan.token('host', (req) => req.headers.host || '-');
  morgan.token('http_x_forwarded_for', (req) => req.headers['x-forwarded-for'] || '-');
  morgan.token('response_time', (req, res) => {
    if (!req._startAt || !res._startAt) {
      return '-';
    }

    const ms = res._startAt[0] - req._startAt[0] + (res._startAt[1] - req._startAt[1]) * 1e-9;
    return ms.toFixed(3);
  });
  if (upstream) {
    morgan.token('upstream_connect_time', (req) => (req.upstreamConnectTime ? `${req.upstreamConnectTime}` : '-'));
    morgan.token('upstream_header_time', (req) => (req.upstreamHeaderTime ? `${req.upstreamHeaderTime}` : '-'));
    morgan.token('upstream_response_time', (req) => (req.upstreamResponseTime ? `${req.upstreamResponseTime}` : '-'));
  }
  morgan.token('cookie_connected_did', (req) => req.cookies?.connected_did || '-');
  morgan.token('cookie_connected_wallet_os', (req) => req.cookies?.connected_wallet_os || '-');
  morgan.token('date_iso', () => dayjs().format('YYYY-MM-DDTHH:mm:ssZ')); // prettier-ignore

  app.use((req, res, next) => {
    if (
      ['/node_modules', '/.yalc', '/src', '/@']
        .map((p) => path.join(prefix, p))
        .some((p) => req.originalUrl.startsWith(p))
    ) {
      return next();
    }

    return morgan(
      `:real_ip - :remote-user [:date_iso] :request_id ":host" ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" ":http_x_forwarded_for" rt=":response_time" uid=":cookie_connected_did" uos=":cookie_connected_wallet_os"${upstream ? ' uct=":upstream_connect_time" uht=":upstream_header_time" urt=":upstream_response_time"' : ''}`,
      { stream }
    )(req, res, next);
  });
};

module.exports = getLogger;
module.exports.initLogger = initLogger;
module.exports.getNoopLogger = getNoopLogger;
module.exports.customPrintfCallback = customPrintfCallback;
module.exports.getInstanceSize = () => instanceMap.size;
module.exports.getAccessLogStream = getAccessLogStream;
module.exports.deleteOldLogfiles = deleteOldLogfiles;
module.exports.setupAccessLogger = setupAccessLogger;
module.exports.instanceMap = instanceMap;
