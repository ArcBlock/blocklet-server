const DEFAULT_CORS_CONFIG = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
  credentials: false,
};

module.exports = {
  DEFAULT_CORS_CONFIG,
};
