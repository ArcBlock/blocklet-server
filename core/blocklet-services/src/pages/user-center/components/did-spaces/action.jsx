import PropTypes from 'prop-types';
import { DIDSpaceConnect, DIDSpaceStatus } from '@blocklet/did-space-react';
import { IconButton, Link, Stack } from '@mui/material';
import Toast from '@arcblock/ux/lib/Toast';
import { joinURL } from 'ufo';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { formatError } from '@blocklet/error';

export function getSpaceHomeUrl(endpoint) {
  const baseUrl = endpoint.replace(/\/api\/space\/.+/, '');
  const strArray = endpoint.replace(/\/$/, '').split('/');
  const spaceDid = strArray.at(-4);

  return joinURL(baseUrl, 'space', spaceDid);
}

function Action({ session, spaceGateway, spaceStatus, refresh }) {
  return (
    <Stack direction="row" spacing={1}>
      {/* 重新连接 */}
      {spaceStatus === DIDSpaceStatus.DISCONNECTED && (
        <DIDSpaceConnect
          reconnect
          variant="outlined"
          session={session}
          spaceDid={session.user?.didSpace?.did}
          spaceGatewayUrl={session.user?.didSpace?.url}
          connectScope="user"
          onSuccess={async () => {
            await refresh();
          }}
          onError={(error) => {
            console.error(error);
            Toast.error(formatError(error));
          }}
        />
      )}
      {/* 打开空间  */}
      <IconButton size="small" LinkComponent={Link} href={getSpaceHomeUrl(spaceGateway.endpoint)} target="_blank">
        <OpenInNewIcon />
      </IconButton>
    </Stack>
  );
}

Action.propTypes = {
  session: PropTypes.object.isRequired,
  spaceGateway: PropTypes.object.isRequired,
  spaceStatus: PropTypes.string.isRequired,
  refresh: PropTypes.func.isRequired,
};

export default Action;
