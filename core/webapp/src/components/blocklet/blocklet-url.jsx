import PropTypes from 'prop-types';
import { useBlockletUrlEvaluation } from '@abtnode/ux/lib/hooks/url-evaluation';

export default function BlockletUrl({ blocklet, children }) {
  const { urls } = useBlockletUrlEvaluation(blocklet);

  const url = urls[0];

  if (!url) {
    return children('');
  }

  return children(url);
}

BlockletUrl.propTypes = {
  blocklet: PropTypes.object.isRequired,
  children: PropTypes.func.isRequired,
};
