import PropTypes from 'prop-types';

// eslint-disable-next-line import/prefer-default-export
export const DomainType = PropTypes.shape({
  href: PropTypes.string,
  accessibility: PropTypes.shape({
    loading: PropTypes.bool,
    accessible: PropTypes.bool,
  }),
  domainStatus: PropTypes.shape({
    isHttps: PropTypes.bool,
    matchedCert: PropTypes.object,
  }),
  dns: PropTypes.shape({
    resolved: PropTypes.bool,
    ip: PropTypes.string,
  }),
});
