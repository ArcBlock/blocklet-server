import PropTypes from 'prop-types';
import React, { useMemo, useCallback } from 'react';
import { Stack, Tooltip } from '@mui/material';
import { OAUTH_SCOPES } from '@abtnode/constant';
import { joinURL } from 'ufo';

import { useNodeContext } from '../../contexts/node';
import { useBlockletContext } from '../../contexts/blocklet';

import ClickToCopy from '../../click-to-copy';

export function ScopeChips({ scope = '', ...props }) {
  if (!scope) return null;

  const scopes = scope.split(' ').filter(Boolean);

  return (
    <Stack
      direction="row"
      {...props}
      sx={[
        {
          flexWrap: 'wrap',
          gap: 1,
        },
        // eslint-disable-next-line react/prop-types
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}>
      {scopes.map((item) => (
        <React.Fragment key={item}>
          <Tooltip title={OAUTH_SCOPES[item]}>
            <ClickToCopy>{item}</ClickToCopy>
          </Tooltip>
        </React.Fragment>
      ))}
    </Stack>
  );
}

ScopeChips.propTypes = {
  scope: PropTypes.string,
};

export const useClientLogo = (logoUri) => {
  const { prefix } = useNodeContext();
  const { blocklet } = useBlockletContext();

  const apiPath = joinURL(prefix, '/api/media/upload', blocklet.appPid);

  const getClientLogoUrl = useCallback(
    (uri) => {
      if (!uri) return '';

      if (uri.startsWith('http')) {
        return uri;
      }

      return `${joinURL(prefix, '/api/media/upload', blocklet.appPid)}/${uri}`;
    },
    [prefix, blocklet.appPid]
  );

  const clientLogoUrl = useMemo(() => getClientLogoUrl(logoUri), [logoUri, getClientLogoUrl]);

  return { clientLogoUrl, apiPath, getClientLogoUrl };
};
