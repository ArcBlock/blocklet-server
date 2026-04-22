const { join } = require('path');

const DEFAULT_MAX_TMPFS_SIZE = '4g';

function parseSize(sizeStr) {
  if (typeof sizeStr === 'string') {
    if (sizeStr.endsWith('m')) {
      return Number(sizeStr.replace('m', ''));
    }
    if (sizeStr.endsWith('g')) {
      return Number(sizeStr.replace('g', '')) * 1024;
    }
    // Try to parse as number (assume GB if no unit)
    return Number(sizeStr) * 1024;
  }
  return Number(sizeStr) * 1024;
}

function parseTmpfs(tmpfs, maxTmpfsSize = DEFAULT_MAX_TMPFS_SIZE, prefixDir = '/') {
  if (!tmpfs) {
    return {
      tmpfs: '',
      size: '0m',
      fullDir: '',
    };
  }
  const [fsPath, size] = tmpfs.split(':');
  if (!fsPath || !size) {
    return {
      tmpfs: '',
      size: '0m',
      fullDir: '',
    };
  }

  const fullDir = join(prefixDir, fsPath);
  const defaultMaxSizeMb = parseSize(DEFAULT_MAX_TMPFS_SIZE);

  // Parse maxTmpfsSize to a number in MB
  let maxSizeMb = parseSize(maxTmpfsSize);
  // Fallback to default if parsing failed (NaN), invalid value, or zero/empty
  if (Number.isNaN(maxSizeMb) || maxSizeMb <= 0) {
    maxSizeMb = defaultMaxSizeMb;
  }

  // Extract size value from various formats:
  // - "1g" or "512m" (simple size)
  // - "1g,rw" or "rw,1g" (size with options)
  // - "size=512m" or "size=1g" (Docker style with size= prefix)
  // - "size=512m,rw" (Docker style with options)
  const sizeParts = size.split(',');
  let sizeValue = '';
  for (const part of sizeParts) {
    let trimmed = part.trim();
    // Handle "size=512m" format - extract the value after "size="
    if (trimmed.startsWith('size=')) {
      trimmed = trimmed.slice(5); // Remove "size=" prefix
    }
    if (trimmed.endsWith('g') || trimmed.endsWith('m')) {
      sizeValue = trimmed;
      break;
    }
  }

  let sizeMb = 0;
  if (sizeValue.endsWith('g')) {
    const parsed = Number(sizeValue.replace('g', ''));
    sizeMb = Number.isNaN(parsed) ? 0 : parsed * 1024;
    sizeMb = Math.min(sizeMb, maxSizeMb);
  }
  if (sizeValue.endsWith('m')) {
    const parsed = Number(sizeValue.replace('m', ''));
    sizeMb = Number.isNaN(parsed) ? 0 : parsed;
    sizeMb = Math.min(sizeMb, maxSizeMb);
  }
  // Ensure sizeMb is valid
  if (Number.isNaN(sizeMb) || sizeMb < 0) {
    sizeMb = 0;
  }
  sizeMb = Math.min(sizeMb, maxSizeMb);

  return {
    tmpfs: `--tmpfs ${fullDir}:size=${sizeMb}m`,
    size: `${sizeMb}m`,
    fullDir,
  };
}

module.exports = {
  parseTmpfs,
  DEFAULT_MAX_TMPFS_SIZE,
};
