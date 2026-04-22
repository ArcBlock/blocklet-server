import { useState } from 'react';
import PropTypes from 'prop-types';

import EditIcon from '@mui/icons-material/Edit';
import Spinner from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { ROUTING_RULE_TYPES } from '@abtnode/constant';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { urlPathFriendly } from '@blocklet/meta/lib/url-path-friendly';

import Toast from '@arcblock/ux/lib/Toast';
import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';
import Confirm from '../../../confirm';
import { validateRule } from '../util';
import ConfigRoutingRule from './config-routing-rule';
import { formatMountPoint } from '../../../util';

export default function UpdateRule({ id: ruleId, from, to, children = null }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);

  const teamDid = blocklet.meta.did;
  const siteId = blocklet.site.id;

  const name = from.pathPrefix;

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async (params) => {
    try {
      const err = await validateRule(params, t);
      if (err) {
        throw err;
      }
      setLoading(true);

      const rule = {
        id: ruleId,
        from: {
          pathPrefix: urlPathFriendly(params.pathPrefix),
        },
        to: {
          type: params.type,
        },
      };

      if (params.type === ROUTING_RULE_TYPES.REDIRECT) {
        rule.to.url = params.url;
        rule.to.redirectCode = params.redirectCode;
      }

      if (params.type === ROUTING_RULE_TYPES.COMPONENT) {
        rule.to.did = teamDid;
        rule.to.componentId = params.componentId;
        rule.to.pageGroup = params.pageGroup;
      }

      if (params.type === ROUTING_RULE_TYPES.GENERAL_REWRITE) {
        rule.to.url = urlPathFriendly(params.url);
      }

      if (params.type === ROUTING_RULE_TYPES.DIRECT_RESPONSE) {
        rule.to.response = {
          status: 200,
          contentType: params.responseType,
          body: params.responseBody,
        };
      }

      await api.updateRoutingRule({ input: { id: siteId, rule, teamDid } });
    } catch (error) {
      Toast.error(error.message);
    } finally {
      setLoading(false);
      setConfirmSetting(null);
    }
  };

  const setting = {
    title: t('router.rule.update.title'),
    // eslint-disable-next-line react/no-unstable-nested-components
    description: (params, setParams, setError) => {
      const setValue = (value) => {
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
            onChange={(e) => {
              let disable = false;
              if (params.type === ROUTING_RULE_TYPES.REDIRECT && !params.url) {
                disable = true;
              }
              if (params.type === ROUTING_RULE_TYPES.GENERAL_REWRITE && !params.url) {
                disable = true;
              }
              if (
                params.type === ROUTING_RULE_TYPES.DIRECT_RESPONSE &&
                (!params.responseType || !params.responseBody)
              ) {
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
          <ConfigRoutingRule params={params} setParams={setValue} setError={setError} />
        </Typography>
      );
    },
    confirm: t('router.rule.update.confirm'),
    cancel: t('router.rule.update.cancel'),
    color: 'primary',
    params: {
      did: to.did || '',
      pathPrefix: name === '/' ? name : name.replace(/^\/+/, '').replace(/\/+$/, ''),
      type: to.type || ROUTING_RULE_TYPES.BLOCKLET,
      redirectCode: to.redirectCode || 302,
      componentId: to.componentId || '',
      pageGroup: to.pageGroup || '',
      url: to.url || '',
      responseType: to.response?.contentType || '',
      responseBody: (to.response?.body || '').replace(/\\"/g, '"'),
      __disableConfirm: false,
    },
    onConfirm,
    onCancel,
  };

  const onMenuItemClick = (e) => {
    e.stopPropagation();
    // eslint-disable-next-line no-unused-expressions
    setConfirmSetting(setting);
  };

  return (
    <>
      {typeof children === 'function' ? (
        children({ loading, open: onMenuItemClick })
      ) : (
        <MenuItem onClick={onMenuItemClick} className="rule-action" data-cy="action-update-rule">
          {loading ? <Spinner size={16} /> : <EditIcon style={{ fontSize: 18, marginRight: 5 }} />}
          {t('router.rule.update.title')}
        </MenuItem>
      )}
      {confirmSetting && (
        <Confirm
          title={confirmSetting.title}
          description={confirmSetting.description}
          confirm={confirmSetting.confirm}
          color={confirmSetting.color}
          cancel={confirmSetting.cancel}
          params={confirmSetting.params}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
        />
      )}
    </>
  );
}

UpdateRule.propTypes = {
  id: PropTypes.string.isRequired,
  from: PropTypes.object.isRequired,
  to: PropTypes.object.isRequired,
  children: PropTypes.any,
};
