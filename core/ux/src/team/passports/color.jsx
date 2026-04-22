/* eslint-disable react/no-danger */
import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Dialog from '@arcblock/ux/lib/Dialog';
import Spinner from '@mui/material/CircularProgress';
import { ChromePicker } from 'react-color';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import createPassportSvg from '@abtnode/auth/lib/util/create-passport-svg';
import { getDisplayName } from '@blocklet/meta/lib/util';
import { getPassportColorFromDid } from '@arcblock/nft-display';
import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import Toast from '@arcblock/ux/lib/Toast';

import { useNodeContext } from '../../contexts/node';
import { useBlockletContext } from '../../contexts/blocklet';
import { BlockletAdminRoles } from '../../util';
import { withPermission } from '../../permission';

function PassportColor({ onCancel, onSuccess }) {
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);

  const curColor = (blocklet.environments.find((x) => x.key === 'BLOCKLET_PASSPORT_COLOR') || {}).value || 'auto';
  const defaultColor = curColor === 'auto' ? getPassportColorFromDid(blocklet.appDid) : curColor;
  const [color, setColor] = useState(defaultColor);

  const onSubmit = async () => {
    const params = [
      {
        key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_PASSPORT_COLOR,
        value: color,
      },
    ];

    try {
      setLoading(true);
      await api.configBlocklet({
        input: {
          did: blocklet.meta.did,
          configs: params,
        },
      });
      onSuccess();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      title={t('team.passport.color')}
      onClose={onCancel}
      open
      fullWidth
      actions={
        <>
          <Button onClick={onCancel} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onSubmit}
            color="primary"
            disabled={loading}
            variant="contained"
            autoFocus
            data-cy="color-btn-confirm">
            {loading && <Spinner size={16} />}
            {t('common.save')}
          </Button>
        </>
      }>
      <Box
        className="dialog-content"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <ChromePicker disableAlpha color={color} onChange={(c) => setColor(c.hex)} />
        <div
          style={{ width: 220, marginLeft: 24 }}
          dangerouslySetInnerHTML={{
            __html: createPassportSvg({
              scope: 'passport',
              role: 'owner',
              title: 'Owner',
              issuer: getDisplayName(blocklet),
              issuerDid: blocklet.appDid,
              ownerName: 'Your Name',
              ownerDid: blocklet.appDid,
              preferredColor: color,
            }),
          }}
        />
      </Box>
    </Dialog>
  );
}

const PassportColorInDaemon = withPermission(PassportColor, 'mutate_team');
const PassportColorInService = withPermission(PassportColor, '', BlockletAdminRoles);

export default function PassportColorWithPermission(props) {
  const { inService } = useNodeContext();
  if (inService) {
    return <PassportColorInService {...props} />;
  }

  return <PassportColorInDaemon {...props} />;
}

PassportColor.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
