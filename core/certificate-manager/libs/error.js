class CustomError extends Error {
  constructor(message) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = CustomError;
