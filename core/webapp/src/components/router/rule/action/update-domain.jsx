/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-curly-newline */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable react/jsx-curly-spacing */
/* eslint-disable react/jsx-one-expression-per-line */
import { useState } from 'react';

import EditIcon from '@mui/icons-material/Edit';
import Spinner from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useRoutingContext, isSpecialDomain } from '../../../../contexts/routing';

import Confirm from '../../../confirm';

import { validateDomain } from './utils';

export default function UpdateDomain({ id, name, onActivate }) {
  const { t } = useLocaleContext();
  const { actions } = useRoutingContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);

  if (isSpecialDomain(name)) {
    return null;
  }

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async params => {
    setLoading(true);
    await actions.updateSite(id, { domain: params.domain.trim() });
    setLoading(false);
    setConfirmSetting(null);
  };

  const setting = {
    title: t('router.domain.update.title'),
    // eslint-disable-next-line react/no-unstable-nested-components
    description: (params, setParams, setError) => (
      <Typography component="div">
        <TextField
          label={t('router.domain.update.label')}
          autoComplete="off"
          variant="outlined"
          name="domain"
          fullWidth
          autoFocus
          value={params.domain}
          style={{ marginBottom: 32 }}
          margin="dense"
          helperText={t('router.domain.update.description')}
          onChange={e => {
            const domain = e.target.value.trim();
            const errMsg = validateDomain(domain, t);
            setParams({ ...params, domain: e.target.value, __disableConfirm: !!errMsg });
            if (errMsg) {
              setError(errMsg);
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
      domain: name,
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
      <MenuItem onClick={onMenuItemClick} className="rule-action">
        {loading ? <Spinner size={16} /> : <EditIcon style={{ fontSize: 18, marginRight: 5 }} />}
        {t('router.domain.update.title')}
      </MenuItem>
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
