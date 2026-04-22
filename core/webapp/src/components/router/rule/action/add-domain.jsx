import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import AddIcon from '@mui/icons-material/Public';
import Spinner from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { BLOCKLET_DYNAMIC_PATH_PREFIX } from '@blocklet/constant';
import { ROUTING_RULE_TYPES } from '@abtnode/constant';

import { useRoutingContext } from '../../../../contexts/routing';
import { useNodeContext } from '../../../../contexts/node';

import Confirm from '../../../confirm';
import ConfigRoutingRule from './config-routing-rule';
import { validateSite, getInitialBlockletDid, validateDomain } from './utils';

export default function AddDomain({ blocklets = [], onActivate = () => {}, children = null }) {
  const { t } = useLocaleContext();
  const { actions } = useRoutingContext();
  const { info } = useNodeContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async params => {
    setLoading(true);
    // add an empty rule when the type is default
    const rule = {
      from: {
        pathPrefix: '/',
      },
      to: {
        type: params.type,
      },
    };
    const data = {
      domain: params.domain.trim() === info.ip ? '' : params.domain.trim(),
    };

    if (params.type === ROUTING_RULE_TYPES.BLOCKLET) {
      // If the blocklet can not be served on dynamic path prefix, we need to update `rule.from.pathPrefix`
      const blocklet = blocklets.find(x => x.meta.did === params.did);
      const bInterface = get(blocklet, 'meta.interfaces', []).find(x => x.name === params.interfaceName);
      if (bInterface && bInterface.prefix !== BLOCKLET_DYNAMIC_PATH_PREFIX) {
        rule.from.pathPrefix = bInterface.prefix;
      }

      rule.to.port = params.port;
      rule.to.did = params.did;
      rule.to.interfaceName = params.interfaceName;
      data.rules = [rule];
    } else if (params.type === ROUTING_RULE_TYPES.REDIRECT) {
      rule.to.url = params.url;
      rule.to.redirectCode = params.redirectCode;
      data.rules = [rule];
    }

    await actions.addSite(data);
    setLoading(false);
    setConfirmSetting(null);
  };

  const setting = {
    title: t('router.domain.addSite'),
    // eslint-disable-next-line react/no-unstable-nested-components
    description: (params, setParams, setError) => {
      const setValue = value => {
        // eslint-disable-next-line no-underscore-dangle
        const __disableConfirm = value.__disableConfirm || !!validateSite(value, t);

        setParams({ ...value, __disableConfirm });
      };

      return (
        <Typography component="div">
          <TextField
            label={t('router.domain.add.description')}
            autoComplete="off"
            variant="outlined"
            name="domain"
            fullWidth
            autoFocus
            value={params.domain}
            style={{ marginTop: 16, marginBottom: 32 }}
            onChange={e => {
              const domain = e.target.value.trim();
              const errMsg = validateDomain(domain, t);
              setValue({ ...params, domain: e.target.value, __disableConfirm: !!errMsg });
              if (errMsg) {
                setError(errMsg);
              } else {
                setError('');
              }
            }}
            slotProps={{
              htmlInput: { 'data-cy': 'domain-name-input' },
            }}
          />
          <ConfigRoutingRule blocklets={blocklets} params={params} setParams={setValue} setError={setError} />
        </Typography>
      );
    },
    confirm: t('router.domain.add.confirm'),
    cancel: t('router.domain.add.cancel'),
    params: {
      domain: '',
      did: getInitialBlockletDid(blocklets),
      port: '',
      interfaceName: '',
      type: ROUTING_RULE_TYPES.BLOCKLET,
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

  useEffect(() => {
    const { searchParams } = new URL(window.location.href);
    const fromDid = searchParams.get('fromDid');
    if (fromDid) {
      setConfirmSetting(setting);
    }
  }, []); // eslint-disable-line

  return (
    <>
      {typeof children === 'function' ? (
        children({ loading, open: onMenuItemClick })
      ) : (
        <MenuItem onClick={onMenuItemClick} className="rule-action" data-cy="action-add-domain">
          {loading ? <Spinner size={16} /> : <AddIcon style={{ fontSize: 18, marginRight: 5 }} />}
          {t('router.domain.add.title')}
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

AddDomain.propTypes = {
  blocklets: PropTypes.array,
  children: PropTypes.any,
  onActivate: PropTypes.func,
};
