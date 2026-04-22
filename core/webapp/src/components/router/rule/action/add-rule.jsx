import { useState } from 'react';
import PropTypes from 'prop-types';

import AddIcon from '@mui/icons-material/Link';
import Spinner from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { ROUTING_RULE_TYPES } from '@abtnode/constant';
import { urlPathFriendly } from '@blocklet/meta/lib/url-path-friendly';

import { formatMountPoint } from '@abtnode/ux/lib/util';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { useRoutingContext } from '../../../../contexts/routing';

import Confirm from '../../../confirm';
import { validateRule, validatePathPrefix, getInitialBlockletDid } from './utils';
import ConfigRoutingRule from './config-routing-rule';

export default function AddRule({
  id,
  blocklets = [],
  onActivate = () => {},
  onRuleAdded = () => {},
  children = null,
  teamDid = '',
}) {
  const { t } = useLocaleContext();
  const { actions } = useRoutingContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async params => {
    const err = await validateRule(params, t);
    if (err) {
      throw err;
    }
    setLoading(true);

    const rule = {
      from: {
        pathPrefix: urlPathFriendly(params.pathPrefix),
      },
      to: {
        type: params.type,
      },
    };

    if (params.type === ROUTING_RULE_TYPES.BLOCKLET) {
      rule.to.port = params.port;
      rule.to.did = params.did;
      rule.to.interfaceName = params.interfaceName;
    } else if (params.type === ROUTING_RULE_TYPES.REDIRECT) {
      rule.to.url = params.url.trim();
      rule.to.redirectCode = params.redirectCode;
    }

    await actions.addRule(id, rule, teamDid);
    setConfirmSetting(null);
    setLoading(false);
    onRuleAdded();
  };

  const setting = {
    title: t('router.rule.add.title'),
    // eslint-disable-next-line react/no-unstable-nested-components
    description: (params, setParams, setError) => {
      const setValue = value => {
        setError(null);
        const validateResult = validateRule(value, t);
        if (validateResult) {
          setParams({ ...value, __disableConfirm: true });
          return;
        }

        setParams({ ...value });
      };

      return (
        <Typography component="div">
          <TextField
            label={t('router.rule.add.pathPrefix')}
            autoComplete="off"
            variant="outlined"
            name="pathPrefix"
            fullWidth
            autoFocus
            helperText={params.helperText || t('router.rule.add.pathPrefixTip')}
            style={{ marginBottom: 32 }}
            margin="dense"
            value={params.pathPrefix}
            onChange={e => {
              let disable = false;
              const validateResult = validatePathPrefix({
                params: { ...params, pathPrefix: e.target.value },
                blocklets,
              });

              setError(validateResult);
              if (params.type === ROUTING_RULE_TYPES.BLOCKLET && validateResult) {
                disable = true;
              }

              if (params.type === ROUTING_RULE_TYPES.REDIRECT && !params.url) {
                disable = true;
              }

              if (!e.target.value.trim()) {
                disable = true;
                setError(t('router.validation.pathPrefixRequired'));
              }
              if (!disable) {
                setError('');
              }

              const helperText = t('common.slugifyHint', { value: formatMountPoint(e.target.value) });

              setParams({ ...params, pathPrefix: e.target.value, helperText, __disableConfirm: disable });
            }}
            slotProps={{
              htmlInput: { 'data-cy': 'path-prefix-input' },
            }}
          />
          <ConfigRoutingRule blocklets={blocklets} params={params} setParams={setValue} setError={setError} />
        </Typography>
      );
    },
    confirm: t('router.rule.add.confirm'),
    cancel: t('common.cancel'),
    params: {
      pathPrefix: '',
      type: ROUTING_RULE_TYPES.BLOCKLET,
      did: getInitialBlockletDid(blocklets),
      port: '',
      interfaceName: '',
      redirectCode: 302,
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
        <MenuItem onClick={onMenuItemClick} className="rule-action" data-cy="action-add-rule">
          {loading ? <Spinner size={16} /> : <AddIcon style={{ fontSize: 18, marginRight: 5 }} />}
          {t('router.rule.add.title')}
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

AddRule.propTypes = {
  id: PropTypes.string.isRequired,
  blocklets: PropTypes.array,
  children: PropTypes.any,
  onActivate: PropTypes.func,
  onRuleAdded: PropTypes.func,
  teamDid: PropTypes.string,
};
