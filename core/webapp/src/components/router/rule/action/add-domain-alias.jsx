import { useState } from 'react';
import PropTypes from 'prop-types';

import AddIcon from '@mui/icons-material/CallMerge';
import Spinner from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useRoutingContext, DOMAIN_FOR_DEFAULT_SITE } from '../../../../contexts/routing';

import Confirm from '../../../confirm';
import { formatError } from '../../../../libs/util';
import { validateDomain } from './utils';

export default function AddDomainAlias({ id, name, onActivate = () => {}, children = null, title = '', teamDid = '' }) {
  const { t } = useLocaleContext();
  const { actions } = useRoutingContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);

  // 不允许给默认站点添加 Additional domain
  if (DOMAIN_FOR_DEFAULT_SITE === name) {
    return null;
  }

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async params => {
    setLoading(true);
    await actions.addDomainAlias(id, params.domain.trim(), !!params.force, teamDid);
    setLoading(false);
    setConfirmSetting(null);
  };

  const onEnter = async (params, confirm, setError) => {
    try {
      await confirm(params);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const setting = {
    title: title || t('router.domainAlias.add.title'),
    // eslint-disable-next-line react/no-unstable-nested-components
    description: (params, setParams, setError) => (
      <Typography component="div">
        <TextField
          label={t('router.domainAlias.add.domainDescription')}
          autoComplete="off"
          variant="outlined"
          name="domain"
          data-cy="add-domain"
          fullWidth
          autoFocus
          value={params.domain}
          style={{ marginBottom: 8 }}
          margin="dense"
          onChange={e => {
            const domain = e.target.value.trim();
            const errMsg = validateDomain(domain, t);
            setParams({ ...params, domain, __disableConfirm: !!errMsg });
            if (errMsg) {
              setError(errMsg);
            } else {
              setError('');
            }
          }}
          onKeyPress={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const domain = e.target.value.trim();
              const errMsg = validateDomain(domain, t);
              if (errMsg) {
                setError(errMsg);
              } else {
                onEnter(params, onConfirm, setError);
              }
            }
          }}
          slotProps={{
            htmlInput: { 'data-cy': 'domain-name-input' },
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={params.force}
              onChange={e => {
                setParams({ ...params, force: e.target.checked });
              }}
              name="checkedB"
              color="primary"
            />
          }
          label={t('router.domainAlias.add.forceTip')}
        />
      </Typography>
    ),
    confirm: t('common.confirm'),
    cancel: t('common.cancel'),
    params: {
      domain: '',
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
        <MenuItem onClick={onMenuItemClick} className="rule-action" data-cy="action-add-domain-alias">
          {loading ? <Spinner size={16} /> : <AddIcon style={{ fontSize: 18, marginRight: 5 }} />}
          {t('router.domainAlias.add.title')}
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

AddDomainAlias.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  children: PropTypes.any,
  onActivate: PropTypes.func,
  title: PropTypes.string,
  teamDid: PropTypes.string,
};
