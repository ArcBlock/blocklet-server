import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSetState } from 'ahooks';

import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/GppGood';
import ErrorIcon from '@mui/icons-material/ErrorOutline';

import { verifyVault } from '@blocklet/meta/lib/security';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

export default function VaultStatus({ vaults, appPid }) {
  const { t } = useLocaleContext();

  const [state, setState] = useSetState({
    verified: false,
    verifying: true,
    error: '',
  });

  useEffect(() => {
    verifyVault(vaults, appPid, true)
      .then((vaultId) => {
        setState({ verified: !!vaultId, verifying: false });
      })
      .catch((err) => {
        setState({ verified: false, verifying: false, error: err.message });
      });
  }, [vaults, appPid, setState]);

  if (state.verifying) {
    return <CircularProgress />;
  }

  if (state.verified) {
    return (
      <Tooltip title={t('blocklet.config.vault.verified')}>
        <CheckCircleIcon fontSize="small" color="success" />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={state.error}>
      <ErrorIcon color="error" />
    </Tooltip>
  );
}

VaultStatus.propTypes = {
  vaults: PropTypes.array.isRequired,
  appPid: PropTypes.string.isRequired,
};
