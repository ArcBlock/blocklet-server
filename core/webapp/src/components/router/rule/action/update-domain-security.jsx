import { useState } from 'react';
import PropTypes from 'prop-types';

import AddIcon from '@mui/icons-material/Add';
import Spinner from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { BLOCKLET_SITE_GROUP_SUFFIX } from '@abtnode/constant';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useRoutingContext, isSpecialDomain } from '../../../../contexts/routing';

import Confirm from '../../../confirm';

export default function UpdateDomainSecurity({
  id,
  name,
  corsAllowedOrigins = '',
  onActivate = () => {},
  children = null,
  teamDid = '',
}) {
  const { t } = useLocaleContext();
  const { actions } = useRoutingContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);

  if (isSpecialDomain(name)) {
    return null;
  }

  let text = name;
  if (name.endsWith(BLOCKLET_SITE_GROUP_SUFFIX)) {
    text = `${t('common.the')} Blocklet`;
  }

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async params => {
    setLoading(true);
    await actions.updateSite(
      id,
      { corsAllowedOrigins: params.corsAllowedOrigins.split(',').map(x => x.trim()) },
      teamDid
    );
    setLoading(false);
    setConfirmSetting(null);
  };

  const setting = {
    title: t('router.domainSecurity.title'),
    // eslint-disable-next-line react/no-unstable-nested-components
    description: (params, setParams, setError) => (
      <Typography component="div">
        <TextField
          label={t('router.domainSecurity.cors.title', { name: text })}
          autoComplete="off"
          variant="outlined"
          name="corsAllowedOrigins"
          fullWidth
          autoFocus
          value={params.corsAllowedOrigins}
          style={{ marginBottom: 32 }}
          margin="dense"
          helperText={t('router.domainSecurity.cors.description', { name: text })}
          onChange={e => {
            setParams({ ...params, corsAllowedOrigins: e.target.value, __disableConfirm: !e.target.value.trim() });
            if (!e.target.value.trim()) {
              setError(t('router.domainSecurity.cors.domainInvalid'));
            } else {
              setError('');
            }
          }}
        />
      </Typography>
    ),
    confirm: t('common.confirm'),
    cancel: t('common.cancel'),
    params: {
      corsAllowedOrigins: Array.isArray(corsAllowedOrigins) ? corsAllowedOrigins.join(', ') : name,
      __disableConfirm: true,
    },
    onConfirm,
    onCancel,
  };

  const onMenuItemClick = e => {
    e.stopPropagation();
    // eslint-disable-next-line no-unused-expressions
    setConfirmSetting(setting) || onActivate();
  };

  return (
    <>
      {typeof children === 'function' ? (
        children({ loading, open: onMenuItemClick })
      ) : (
        <MenuItem onClick={onMenuItemClick} className="rule-action" data-cy="action-update-domain">
          {loading ? <Spinner size={16} /> : <AddIcon style={{ fontSize: 18, marginRight: 5 }} />}
          {t('router.domainSecurity.title')}
        </MenuItem>
      )}
      {confirmSetting && (
        <Confirm
          title={confirmSetting.title}
          description={confirmSetting.description}
          confirm={confirmSetting.confirm}
          cancel={confirmSetting.cancel}
          params={confirmSetting.params}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
          color="primary"
        />
      )}
    </>
  );
}

UpdateDomainSecurity.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  children: PropTypes.any,
  onActivate: PropTypes.func,
  corsAllowedOrigins: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  teamDid: PropTypes.string,
};
