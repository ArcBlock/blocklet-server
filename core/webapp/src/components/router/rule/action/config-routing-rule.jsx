/* eslint-disable react/jsx-wrap-multilines */
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import sortBy from 'lodash/sortBy';
import get from 'lodash/get';

import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { ROUTING_RULE_TYPES } from '@abtnode/constant';

import { BLOCKLET_DYNAMIC_PATH_PREFIX, BLOCKLET_INTERFACE_TYPE_WEB } from '@blocklet/constant';

import BlockletStatus from '@abtnode/ux/lib/blocklet/status';

const getWebInterface = blocklet => {
  const list = get(blocklet, 'meta.interfaces') || [];
  return list.find(x => x.type === BLOCKLET_INTERFACE_TYPE_WEB);
};

export default function ConfigRoutingRule({
  params = {},
  blocklets = [],
  setParams = () => {},
  setError = () => {},
  serviceTypes = [
    { name: 'Blocklet', value: ROUTING_RULE_TYPES.BLOCKLET },
    { name: 'Redirect', value: ROUTING_RULE_TYPES.REDIRECT },
    { name: 'Default - User will see the 404 page', value: ROUTING_RULE_TYPES.NONE },
  ],
}) {
  const { t } = useLocaleContext();

  const redirectCodesMap = {
    301: t('common.redirectPermanently'),
    302: t('common.redirectTemporary'),
    307: t('common.redirectTemporary'),
    308: t('common.redirectPermanently'),
  };

  const sortedBlocklets = sortBy(blocklets, x => x.meta.name);

  const getParamsFromInterface = (blocklet, selected) => {
    if (!selected) {
      return {};
    }

    let { port } = blocklet;
    if (selected && blocklet.ports && selected.port) {
      if (blocklet.ports[selected.port]) {
        port = blocklet.ports[selected.port];
      }
      if (blocklet.ports[selected.port.internal]) {
        port = blocklet.ports[selected.port.internal];
      }
    }

    // When the blocklet interface can only be mounted at a fixed path
    let { pathPrefix } = params;
    if (selected && selected.prefix !== BLOCKLET_DYNAMIC_PATH_PREFIX) {
      pathPrefix = selected.prefix;
    }

    return { port, pathPrefix };
  };

  const getParamsOnBlockletChange = did => {
    const blocklet = sortedBlocklets.find(x => x.meta.did === did);
    const webInterface = getWebInterface(blocklet);

    return { ...getParamsFromInterface(blocklet, webInterface), interfaceName: webInterface ? webInterface.name : '' };
  };

  useEffect(() => {
    if (!params.interfaceName && params.type === ROUTING_RULE_TYPES.BLOCKLET) {
      setParams({ ...params, ...getParamsOnBlockletChange(params.did), __disableConfirm: false });
    }
  }, []); // eslint-disable-line

  return (
    <>
      <TextField
        select
        label={t('router.domain.add.type')}
        autoComplete="off"
        variant="outlined"
        name="type"
        data-cy="domain-add-type"
        fullWidth
        value={params.type}
        onChange={e => {
          setError('');
          setParams({ ...params, type: e.target.value, __disableConfirm: false });
        }}
        style={{ marginBottom: 32 }}
        slotProps={{
          select: {},
        }}>
        {serviceTypes.map(({ name, value }) => (
          <MenuItem key={value} value={value}>
            {name}
          </MenuItem>
        ))}
      </TextField>
      {params.type === ROUTING_RULE_TYPES.BLOCKLET && (
        <TextField
          select
          label={t('router.domain.add.blocklet')}
          autoComplete="off"
          variant="outlined"
          name="did"
          data-cy="domain-blocklet-select"
          fullWidth
          value={params.did}
          onChange={e => {
            setParams({
              ...params,
              ...getParamsOnBlockletChange(e.target.value),
              did: e.target.value,
              __disableConfirm: false,
            });
          }}
          style={{ marginBottom: 32 }}>
          {sortedBlocklets.map(x => (
            <MenuItem key={x.meta.did} value={x.meta.did}>
              {`${x.meta.name}  v${x.meta.version}`}
              <span style={{ marginLeft: 8 }}>
                <BlockletStatus status={x.status} progress={x.progress} />
              </span>
            </MenuItem>
          ))}
          {blocklets.length === 0 && (
            <MenuItem key="empty" value="">
              {t('common.empty')}
            </MenuItem>
          )}
        </TextField>
      )}
      {params.type === ROUTING_RULE_TYPES.REDIRECT && [
        <TextField
          select
          label={t('router.domain.add.redirect')}
          autoComplete="off"
          variant="outlined"
          name="type"
          fullWidth
          value={params.redirectCode}
          onChange={e => setParams({ ...params, redirectCode: e.target.value })}
          style={{ marginBottom: 32 }}
          slotProps={{
            select: {},
          }}>
          {Object.keys(redirectCodesMap).map(code => (
            <MenuItem key={code} value={code}>
              {`${redirectCodesMap[code]} - ${code}`}
            </MenuItem>
          ))}
        </TextField>,
        <TextField
          label={t('common.redirectUrl')}
          autoComplete="off"
          variant="outlined"
          name="url"
          fullWidth
          autoFocus
          value={params.url}
          helperText={t('router.urlHelperText')}
          style={{ marginBottom: 32 }}
          onChange={e => {
            setParams({ ...params, url: e.target.value, __disableConfirm: !e.target.value.trim() });
            if (!e.target.value.trim()) {
              setError(t('router.validation.redirectUrlRequired'));
            } else {
              setError('');
            }
          }}
          slotProps={{
            htmlInput: {
              'data-cy': 'redirect-url-input',
            },
          }}
        />,
      ]}
    </>
  );
}

ConfigRoutingRule.propTypes = {
  params: PropTypes.object,
  blocklets: PropTypes.array,
  serviceTypes: PropTypes.array,
  setParams: PropTypes.func,
  setError: PropTypes.func,
};
