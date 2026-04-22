const { isValid: isValidDid } = require('@arcblock/did');

const keys = [
  'appDid',
  'appPid',
  'blockletDid',
  'componentDid',
  'did',
  'nftDid',
  'ownerDid',
  'rootDid',
  'teamDid',
  'userDid',
];

const verifyDid = (req, res, next) => {
  const query = req.query || {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(query, key) && !isValidDid(query[key])) {
      res.status(400).json({ error: `${key} is invalid` });
      return;
    }
  }
  next();
};

module.exports = verifyDid;
