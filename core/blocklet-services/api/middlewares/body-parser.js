const bodyParser = require('body-parser');
const { MAX_UPLOAD_FILE_SIZE } = require('@abtnode/constant');

// body parser only for blocklet service related request
const maxUploadSize = Number(process.env.MAX_UPLOAD_FILE_SIZE) || MAX_UPLOAD_FILE_SIZE;

module.exports = [
  bodyParser.json({ limit: `${maxUploadSize}mb` }),
  bodyParser.urlencoded({ extended: true, limit: `${maxUploadSize}mb` }),
];
