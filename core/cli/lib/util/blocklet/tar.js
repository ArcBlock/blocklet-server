const fs = require('fs-extra');
const tar = require('tar');
const byteSize = require('byte-size');
const columnify = require('columnify');

// eslint-disable-next-line no-console
const logger = { notice: console.log };

const logTar = (tarball, opts = {}) => {
  const { unicode = true, log = logger } = opts;
  log.notice('');
  log.notice(`${unicode ? '📦 ' : 'bundle:'} ${tarball.name}@${tarball.version}`);
  log.notice('=== Tarball Contents ===');
  if (tarball.files.length) {
    log.notice(
      columnify(
        tarball.files
          .map((f) => {
            const bytes = byteSize(f.size);
            return /^node_modules\//.test(f.path) ? null : { path: f.path, size: `${bytes.value}${bytes.unit}` };
          })
          .filter((f) => f),
        {
          include: ['size', 'path'],
          showHeaders: false,
        }
      )
    );
  }
  if (tarball.bundled.length) {
    log.notice('=== Bundled Dependencies ===');
    tarball.bundled.forEach((name) => log.notice('', name));
  }
  log.notice('=== Tarball Details ===');
  log.notice(
    columnify(
      [
        { name: 'name:', value: tarball.name },
        { name: 'version:', value: tarball.version },
        tarball.filename && { name: 'filename:', value: tarball.filename },
        { name: 'bundle size:', value: byteSize(tarball.size) },
        { name: 'unpacked size:', value: byteSize(tarball.unpackedSize) },
        { name: 'shasum:', value: tarball.shasum },
        {
          name: 'integrity:',
          value: `${tarball.integrity.toString().substr(0, 20)}[...]${tarball.integrity.toString().substr(80)}`,
        },
        tarball.bundled.length && { name: 'bundled deps:', value: tarball.bundled.length },
        tarball.bundled.length && { name: 'bundled files:', value: tarball.entryCount - tarball.files.length },
        tarball.bundled.length && { name: 'own files:', value: tarball.files.length },
        { name: 'total files:', value: tarball.entryCount },
      ].filter((x) => x),
      {
        include: ['name', 'value'],
        showHeaders: false,
      }
    )
  );
  log.notice('');
};

const getContents = async (meta, tarball) => {
  const files = [];
  const bundled = new Set();
  let totalEntries = 0;
  let totalEntrySize = 0;

  await tar.list({
    file: tarball,
    sync: true,
    onentry: (entry) => {
      totalEntries++;
      totalEntrySize += entry.size;
      const p = entry.path;
      if (p.startsWith('package/node_modules/')) {
        const name = p.match(/^package\/node_modules\/((?:@[^/]+\/)?[^/]+)/)[1];
        bundled.add(name);
      }
      files.push({
        path: entry.path.replace(/^package\//, ''),
        size: entry.size,
        mode: entry.mode,
      });
    },
  });

  const comparator = (a, b) =>
    a.path.localeCompare(b.path, undefined, {
      sensitivity: 'case',
      numeric: true,
    });

  const isUpper = (str) => {
    const ch = str.charAt(0);
    return ch >= 'A' && ch <= 'Z';
  };

  const uppers = files.filter((file) => isUpper(file.path));
  const others = files.filter((file) => !isUpper(file.path));

  uppers.sort(comparator);
  others.sort(comparator);

  return {
    id: `${meta.name}@${meta.version}`,
    name: meta.name,
    version: meta.version,
    size: fs.statSync(tarball).size,
    unpackedSize: totalEntrySize,
    shasum: meta.dist.shasum,
    integrity: meta.dist.integrity,
    filename: meta.dist.tarball,
    files: uppers.concat(others),
    entryCount: totalEntries,
    bundled: Array.from(bundled),
  };
};

module.exports = { logTar, getContents };
