/**
 * @param {Array<{
 *  status: 'extracting' | 'downloading';
 *  total: number;
 *  current: number;
 *  name: string; // for extracting
 *  component: {
 *    title: string
 *  }
 * }>} progresses
 * @param {{
 *   paddingStart: string
 * }} param1
 * @returns {string}
 */
const getDownloadBundleStep = (progresses, { paddingStart = '' } = {}) => {
  const lines = (progresses || []).map((progress) => {
    const title = `${progress.status === 'extracting' ? 'Extracting' : 'Downloading'} ${
      progress.component?.title || ''
    }`;

    const percent =
      progress.total && progress.current ? `: ${Math.floor((progress.current / progress.total) * 100)}%` : '';

    let name = progress.name ? `: ${progress.name}` : '';
    if (!percent) {
      name += '...';
    }

    return `${title}${percent}${name}`;
  });

  return lines.join(`\n${paddingStart}`);
};

module.exports = getDownloadBundleStep;
