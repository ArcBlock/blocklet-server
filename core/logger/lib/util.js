const path = require('path');

const getPreDate = (date) => {
  date.setUTCDate(date.getUTCDate() - 1);

  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, 0);
  const day = date.getUTCDate().toString().padStart(2, 0);

  return { year, month, day };
};

const getAccessLogFilenameGenerator = (filename) => (time, index) => {
  let tempFilename = filename || 'access.log';

  if (path.extname(tempFilename) !== '.log') {
    tempFilename = `${tempFilename}.log`;
  }

  if (!time) {
    return tempFilename;
  }

  const { year, month, day } = getPreDate(time);

  const nameWithoutExtension = path.basename(tempFilename, '.log');

  let finalName = `${nameWithoutExtension}-${year}-${month}-${day}`;

  if (index > 1) {
    finalName = `${finalName}-${index}`;
  }

  return `${finalName}.log.gz`;
};

module.exports = {
  getPreDate,
  getAccessLogFilenameGenerator,
};
