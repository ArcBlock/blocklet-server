const { slugify } = require('transliteration');
const { urlPathFriendly } = require('./url-path-friendly');

// the method will not format characters: "_", "."
const convertToMoniker = (title, defaultMoniker = 'application') => {
  return (
    urlPathFriendly(
      slugify(title || defaultMoniker, {
        allowedChars: 'a-zA-Z0-9-_~',
      })
    ) || defaultMoniker
  );
};

module.exports = {
  convertToMoniker,
};
