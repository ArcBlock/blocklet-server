const os = require('os');
const path = require('path');

const TMP_FOLDER_NAME = 'arcblock-abtnode';

module.exports = (folderName = '') => path.join(os.tmpdir(), TMP_FOLDER_NAME, String(folderName) || 'tmp');
