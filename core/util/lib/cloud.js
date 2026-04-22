const isEC2 = require('./is-ec2');
const gcp = require('./gcp');

const isInCloud = () => {
  return Promise.all([isEC2(), gcp.isInGCP()]).then(([inEC2, inGCP]) => {
    return inEC2 || inGCP;
  });
};

module.exports = {
  isInCloud,
};
