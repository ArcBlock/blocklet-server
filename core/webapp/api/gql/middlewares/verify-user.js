const { validateOperator } = require('@abtnode/core/lib/util/verify-access-key-user');

module.exports = ({ userDid }, context) => {
  validateOperator(context, userDid);
};
