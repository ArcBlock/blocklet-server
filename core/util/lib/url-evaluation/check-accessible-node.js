const { default: axios } = require('axios');

module.exports = async (url, timeout = 5000) => {
  try {
    await axios.head(url, {
      timeout,
      // any response with a status code is considered accessible (including 4xx/5xx)
      validateStatus: null,
    });
    return true;
  } catch (e) {
    return false;
  }
};
