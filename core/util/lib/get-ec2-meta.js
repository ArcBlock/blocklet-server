const debug = require('debug')('get-ec2-meta');
const axios = require('./axios');

const HOST = 'http://169.254.169.254/latest';

// Link: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-data-retrieval.html
// Link: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-add-user-data.html
const getEc2Meta = async (key, timeout = 5000) => {
  let url = `${HOST}/meta-data/${key}`;
  if (key === 'user-data') {
    url = `${HOST}/${key}`;
  }
  if (key === 'instance-identity') {
    url = `${HOST}/dynamic/instance-identity/document`;
  }

  try {
    const result = await axios.get(url, { timeout });
    debug('get ec2 meta', { key, status: result.status, data: result.data });
    if (result.status === 200) {
      return result.data;
    }

    return '';
  } catch (err) {
    debug('Failed to fetch ec2 meta', err);

    if (err.response?.status === 401) {
      try {
        let result = await axios.put(
          `${HOST}/api/token`,
          {},
          {
            timeout,
            headers: {
              'X-aws-ec2-metadata-token-ttl-seconds': 21600,
            },
          }
        );
        result = await axios.get(url, { timeout, headers: { 'X-aws-ec2-metadata-token': result.data } });
        if (result.status === 200) {
          return result.data;
        }
        return '';
      } catch (e) {
        debug('Failed to fetch ec2 meta with auth', e);
      }
    }

    return '';
  }
};

module.exports = getEc2Meta;
