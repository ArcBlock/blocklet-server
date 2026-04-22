const isDocker = require('is-docker');

module.exports = (env = process.env) => {
  try {
    if (typeof env.ABT_NODE_TEST_DOCKER === 'undefined') {
      return isDocker();
    }

    const isDockerEnv = JSON.parse(env.ABT_NODE_TEST_DOCKER);
    return !!isDockerEnv;
  } catch (error) {
    return isDocker();
  }
};
