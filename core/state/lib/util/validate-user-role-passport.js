const { CustomError } = require('@blocklet/error');

const validateUserRolePassport = ({ role, passports }) => {
  if (!Array.isArray(passports)) {
    throw new CustomError(400, 'Invalid passports: must be an array');
  }

  if (!role || typeof role !== 'string') {
    throw new CustomError(400, 'Invalid role: must be a non-empty string');
  }

  const filterPassports = passports.filter((x) => x.status === 'valid' && x.role === role);

  if (filterPassports.length === 0) {
    throw new CustomError(400, `No valid passport found: you don't have the required role "${role}".`);
  }

  const isValid = filterPassports.every((x) => x.expirationDate);
  if (isValid) {
    throw new CustomError(
      400,
      `The passport for role "${role}" is only temporary and cannot be used to invite new members.`
    );
  }
};

module.exports = { validateUserRolePassport };
