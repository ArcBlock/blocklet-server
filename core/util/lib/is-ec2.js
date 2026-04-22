const getEc2Meta = require('./get-ec2-meta');

// Whether we are running in an pre-baked image
// refer: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/identify_ec2_instances.html
async function isEC2() {
  const meta = await getEc2Meta('instance-identity');
  return !!meta;
}

module.exports = isEC2;
