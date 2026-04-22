import { useContext } from 'react';
import PropTypes from 'prop-types';
import { joinURL } from 'ufo';
import toUpper from 'lodash/toUpper';

import Tag from '@arcblock/ux/lib/Tag';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

import ExternalLink from '@mui/material/Link';
import Box from '@mui/material/Box';

export default function BlockletSource({ sourceInfo = {}, blocklet = {} }) {
  const { t } = useContext(LocaleContext);

  let { source } = sourceInfo;
  if (source === 'registry') {
    source = 'Blocklet Store';
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}>
      <Tag key="source" type="success">
        {toUpper(source)}
      </Tag>
      {sourceInfo.source === 'registry' && (
        <ExternalLink
          href={joinURL(sourceInfo.deployedFrom, 'blocklets', blocklet?.meta?.bundleDid || '')}
          target="_blank"
          className="page-link"
          underline="hover"
          style={{
            display: 'flex',
            alignItems: 'center',
            marginLeft: 8,
          }}>
          {t('blocklet.overview.viewInStore')}
        </ExternalLink>
      )}
    </Box>
  );
}

BlockletSource.propTypes = {
  sourceInfo: PropTypes.shape({
    source: PropTypes.string,
    deployedFrom: PropTypes.string,
  }),
  blocklet: PropTypes.object,
};
