import { useContext } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import ExternalLink from '@mui/material/Link';
import Spinner from '@mui/material/CircularProgress';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useBlockletUrlEvaluation } from '@abtnode/ux/lib/hooks/url-evaluation';
import LaunchIcon from '@mui/icons-material/Launch';

export default function BlockletInterface({ blocklet, skipAccessibilityCheck = false, ...props }) {
  const { t } = useContext(LocaleContext);
  const { urls, loading, recommendedUrl } = useBlockletUrlEvaluation(blocklet);

  if (loading && !skipAccessibilityCheck) {
    return <Spinner size={12} {...props} />;
  }

  const url = skipAccessibilityCheck ? urls[0] : recommendedUrl;

  if (!url) {
    return t('blocklet.router.noAccessibleUrl');
  }

  return (
    <Container {...props}>
      <Flex>
        <ExternalLink href={url} target="_blank" className="blocklet-interface" underline="hover">
          {t('common.visit')}
          <LaunchIcon fontSize="12" sx={{ marginLeft: 0.5 }} />
        </ExternalLink>
      </Flex>
    </Container>
  );
}

const Flex = styled.div`
  display: flex;
  margin: 4px 0;
`;

const Container = styled.div`
  .blocklet-interface {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    white-space: nowrap;

    img {
      margin-right: 4px;
    }
  }
`;

BlockletInterface.propTypes = {
  blocklet: PropTypes.object.isRequired,
  skipAccessibilityCheck: PropTypes.bool,
};
