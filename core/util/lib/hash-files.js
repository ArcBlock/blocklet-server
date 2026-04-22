const { promisify } = require('util');
const path = require('path');

const walker = require('folder-walker');
const pump = promisify(require('pump'));
const objWriter = require('flush-write-stream').obj;
const hasha = require('hasha');
const transform = require('parallel-transform');
const objFilterCtor = require('through2-filter').objCtor;
const map = require('through2-map').obj;

const normalizePath = (relname) => {
  if (relname.includes('#') || relname.includes('?')) {
    throw new Error(`Invalid filename ${relname}. Deployed filenames cannot contain # or ? characters`);
  }
  return (
    relname
      .split(path.sep)
      // .map(segment => encodeURI(segment)) // TODO I'm fairly certain we shouldn't encodeURI here, thats only for the file upload step
      .join('/')
  );
};

// a parallel transform stream segment ctor that hashes fileObj's created by folder-walker
const hasherCtor = ({ concurrentHash, hashAlgorithm = 'sha1' }) => {
  const hashaOpts = { algorithm: hashAlgorithm };
  if (!concurrentHash) throw new Error('Missing required opts');
  return transform(concurrentHash, { objectMode: true }, (fileObj, cb) => {
    hasha
      .fromFile(fileObj.filepath, hashaOpts)
      // insert hash and asset type to file obj
      .then((hash) => cb(null, Object.assign({}, fileObj, { hash })))
      .catch((err) => cb(err));
  });
};

// Inject normalized file names into normalizedPath and assetType
const fileNormalizerCtor = ({ assetType = 'file' }) =>
  map((fileObj) => Object.assign({}, fileObj, { assetType, normalizedPath: normalizePath(fileObj.relname) }));

// A writable stream segment ctor that normalizes file paths
const manifestCollectorCtor = (filesObj) =>
  objWriter((fileObj, _, cb) => {
    filesObj[fileObj.normalizedPath] = fileObj.hash;
    cb(null);
  });

// transform stream ctor that filters folder-walker results for only files
const fileFilterCtor = objFilterCtor((fileObj) => fileObj.type === 'file');

const defaultFilter = () => true;

/**
 * @param {string} dir
 * @param {object} opts
 * @param {function(file): boolean} opts.filter
 * @param {number} opts.concurrentHash
 * @return {object} { files: { file1: hash, file2: hash, ... }}
 */
const hashFiles = async (dir, opts) => {
  // eslint-disable-next-line no-param-reassign
  opts = Object.assign(
    {
      filter: defaultFilter,
      concurrentHash: 100,
    },
    opts,
    {
      assetType: 'file',
    }
  );

  const fileStream = walker(dir, { filter: opts.filter });
  const filter = fileFilterCtor();
  const hasher = hasherCtor(opts);
  const fileNormalizer = fileNormalizerCtor(opts);

  // Written to by manifestCollector
  const files = {}; // normalizedPath: hash
  const manifestCollector = manifestCollectorCtor(files);

  await pump(fileStream, filter, hasher, fileNormalizer, manifestCollector);

  return { files };
};

module.exports = hashFiles;
