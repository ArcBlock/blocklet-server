import React, { useState } from 'react';
import PropTypes from 'prop-types';

import AddIcon from '@mui/icons-material/Link';
import Spinner from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { ROUTING_RULE_TYPES } from '@abtnode/constant';
import { urlPathFriendly } from '@blocklet/meta/lib/url-path-friendly';

import Toast from '@arcblock/ux/lib/Toast';
import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';
import Confirm from '../../../confirm';
import { validateRule, validatePathPrefix } from '../util';
import ConfigRoutingRule from './config-routing-rule';
import { formatMountPoint } from '../../../util';

export default function AddRule({ children = null, hiddenChildren = false, open = false, onClose = null }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const teamDid = blocklet.meta.did;
  const siteId = blocklet.site.id;

  const onCancel = () => {
    onClose?.();
    setLoading(false);
    setShowConfirm(false);
  };

  const onConfirm = async (params) => {
    try {
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

      if (params.type === ROUTING_RULE_TYPES.REDIRECT) {
        rule.to.url = params.url.trim();
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

      await api.addRoutingRule({ input: { id: siteId, rule, teamDid } });
      onClose?.();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const setting = {
    title: t('router.rule.add.title'),
    // eslint-disable-next-line react/no-unstable-nested-components
    description: (params, setParams, setError) => {
      const setValue = (value) => {
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
            helperText={params.pathPrefixHint || t('router.rule.add.pathPrefixTip')}
            style={{ marginBottom: 32 }}
            margin="dense"
            value={params.pathPrefix}
            onChange={(e) => {
              let disable = false;
              const validateResult = validatePathPrefix({
                params: { ...params, pathPrefix: e.target.value },
                blocklets: [blocklet],
              });

              setError(validateResult);
              if (params.type === ROUTING_RULE_TYPES.BLOCKLET && validateResult) {
                disable = true;
              }

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

              const pathPrefixHint = t('common.slugifyHint', { value: formatMountPoint(e.target.value) });

              setParams({ ...params, pathPrefix: e.target.value, pathPrefixHint, __disableConfirm: disable });
            }}
            slotProps={{
              htmlInput: { 'data-cy': 'path-prefix-input' },
            }}
          />
          <ConfigRoutingRule params={params} setParams={setValue} setError={setError} />
        </Typography>
      );
    },
    confirm: t('router.rule.add.confirm'),
    cancel: t('common.cancel'),
    params: {
      did: '',
      pathPrefix: '',
      type: ROUTING_RULE_TYPES.REDIRECT,
      componentId: '',
      pageGroup: '',
      redirectCode: 302,
      responseType: 'text/plain',
      responseBody: '',
      __disableConfirm: true,
    },
    onConfirm,
    onCancel,
  };

  const onMenuItemClick = (e) => {
    e.stopPropagation();
    // eslint-disable-next-line no-unused-expressions
    setShowConfirm(true);
  };
  let child = null;
  if (!hiddenChildren) {
    child =
      typeof children === 'function' ? (
        children({ open: onMenuItemClick })
      ) : (
        <MenuItem onClick={onMenuItemClick} className="rule-action" data-cy="action-add-rule">
          {loading ? <Spinner size={16} /> : <AddIcon style={{ fontSize: 18, marginRight: 5 }} />}
          {t('router.rule.add.title')}
        </MenuItem>
      );
  }

  return (
    <>
      {child}
      {(open || showConfirm) && (
        <Confirm
          title={setting.title}
          description={setting.description}
          confirm={setting.confirm}
          cancel={setting.cancel}
          params={setting.params}
          onConfirm={setting.onConfirm}
          onCancel={setting.onCancel}
          color="primary"
        />
      )}
    </>
  );
}

AddRule.propTypes = {
  children: PropTypes.any,
  onClose: PropTypes.func,
  hiddenChildren: PropTypes.bool,
  open: PropTypes.bool,
};
