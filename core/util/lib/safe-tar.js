const fs = require('fs-extra');
const path = require('path');
const tar = require('tar');

const DISALLOWED_ENTRY_TYPES = new Set(['SymbolicLink', 'Link']);

const isWindowsAbsolutePath = (entryPath) => /^[a-zA-Z]:[\\/]/.test(entryPath) || entryPath.startsWith('\\\\');

const isPathInside = (target, root) => {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const assertNoExistingSymlinkParent = (target, root) => {
  let current = path.dirname(target);
  const resolvedRoot = path.resolve(root);

  while (isPathInside(current, resolvedRoot) && current !== resolvedRoot) {
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) {
      throw new Error(`Unsafe tar entry parent: ${path.relative(resolvedRoot, current)}`);
    }
    current = path.dirname(current);
  }
};

const normalizeEntryPath = (entryPath) => {
  if (!entryPath || entryPath.includes('\0')) {
    throw new Error('Unsafe tar entry path');
  }

  if (path.isAbsolute(entryPath) || isWindowsAbsolutePath(entryPath)) {
    throw new Error(`Unsafe tar entry path: ${entryPath}`);
  }

  const normalized = entryPath.replace(/\\/g, '/');
  if (normalized.split('/').includes('..')) {
    throw new Error(`Unsafe tar entry path: ${entryPath}`);
  }

  return normalized;
};

const validateTarEntry = ({ entryPath, entry, cwd }) => {
  if (DISALLOWED_ENTRY_TYPES.has(entry?.type)) {
    throw new Error(`Unsafe tar entry type: ${entry.type}`);
  }

  const normalized = normalizeEntryPath(entryPath);
  const resolvedCwd = path.resolve(cwd);
  const target = path.resolve(resolvedCwd, normalized);
  if (!isPathInside(target, resolvedCwd)) {
    throw new Error(`Unsafe tar entry path: ${entryPath}`);
  }

  assertNoExistingSymlinkParent(target, resolvedCwd);
};

const createSafeTarExtractOptions = ({ cwd, strip = 0, ...options }) => {
  const resolvedCwd = path.resolve(cwd);
  fs.ensureDirSync(resolvedCwd);
  return {
    ...options,
    C: resolvedCwd,
    strip,
    preservePaths: false,
    unlink: true,
    filter: (entryPath, entry) => {
      validateTarEntry({ entryPath, entry, cwd: resolvedCwd });
      return typeof options.filter === 'function' ? options.filter(entryPath, entry) : true;
    },
  };
};

const createSafeTarExtractStream = (options) => tar.x(createSafeTarExtractOptions(options));

const safeTarExtract = ({ file, ...options }) => tar.x({ file, ...createSafeTarExtractOptions(options) });

module.exports = {
  createSafeTarExtractOptions,
  createSafeTarExtractStream,
  safeTarExtract,
  validateTarEntry,
};
