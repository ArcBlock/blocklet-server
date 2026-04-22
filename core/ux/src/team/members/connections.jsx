import React from 'react';
import PropTypes from 'prop-types';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { LOGIN_PROVIDER } from '@arcblock/ux/lib/Util/constant';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import DidAddress from '../../did-address';
import RegisterPasskey from '../passkeys/register';
import { useSessionContext } from '../../contexts/session';

export default function UserConnections({ user, onChangeUser = () => {} }) {
  const connectedAccounts = user.connectedAccounts || [];
  const { t } = useLocaleContext();
  const { session } = useSessionContext();
  const { disconnectPasskey } = session.usePasskey();

  const hasPasskey = connectedAccounts.some((account) => account.provider === LOGIN_PROVIDER.PASSKEY && account.did);

  return (
    <div>
      {connectedAccounts.map((account) => {
        return (
          <div key={account.did}>
            <InfoRow
              style={{ alignItems: 'flex-start', cursor: 'pointer' }}
              valueComponent="div"
              key={account.did}
              nameWidth={120}
              name={account.provider}
              onClick={() => {
                const el = document.getElementById(`account-details-${account.did}`);
                if (el) {
                  el.style.display = el.style.display === 'none' ? 'block' : 'none';
                }
              }}>
              <DidAddress did={account.did} showQrcode />
            </InfoRow>
            <Paper
              id={`account-details-${account.did}`}
              sx={{
                display: 'none',
                mt: -1,
                mb: 1,
                pt: 1,
                pl: 1,
                pr: 1,
                boxShadow: 'none',
                border: '1px solid #e0e0e0',
              }}>
              {account.did && (
                <InfoRow nameWidth={120} name="DID">
                  {account.did}
                </InfoRow>
              )}
              {account.pk && (
                <InfoRow nameWidth={120} name="PublicKey">
                  {account.pk}
                </InfoRow>
              )}
              {account.id && (
                <InfoRow nameWidth={120} name="ID">
                  {account.id}
                </InfoRow>
              )}
              {account.sub && (
                <InfoRow nameWidth={120} name="Sub">
                  {account.sub}
                </InfoRow>
              )}
              {account.lastLoginAt && (
                <InfoRow nameWidth={120} name="Last Login">
                  {account.lastLoginAt}
                </InfoRow>
              )}
              {account.counter && (
                <InfoRow nameWidth={120} name="Counter">
                  {account.counter}
                </InfoRow>
              )}
              {account.userInfo && (
                <InfoRow nameWidth={120} name="User Info">
                  <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(account.userInfo, null, 2)}</pre>
                </InfoRow>
              )}
              {account.extra && (
                <InfoRow nameWidth={120} name="Extra">
                  <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(account.extra, null, 2)}</pre>
                </InfoRow>
              )}
              {account.provider === LOGIN_PROVIDER.PASSKEY && (
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  sx={{ mb: 1 }}
                  onClick={async () => {
                    await disconnectPasskey({ session, connectedAccount: account });
                    await onChangeUser(user);
                  }}>
                  {t('common.disconnect')}
                </Button>
              )}
            </Paper>
          </div>
        );
      })}
      <RegisterPasskey hasPasskey={hasPasskey} refresh={session.refresh} />
    </div>
  );
}

UserConnections.propTypes = {
  user: PropTypes.object.isRequired,
  onChangeUser: PropTypes.func,
};
