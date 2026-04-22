import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { ROUTING_RULE_TYPES, ROUTING_RESPONSE_TYPES } from '@abtnode/constant';
import { BLOCKLET_INTERFACE_TYPE_WEB } from '@blocklet/constant';

import { findWebInterface, getDisplayName } from '@blocklet/meta/lib/util';
import { useBlockletContext } from '../../../contexts/blocklet';

const getComponents = (blocklet) =>
  blocklet.children.filter((x) => x.meta.interfaces.find((i) => i.type === BLOCKLET_INTERFACE_TYPE_WEB));

export default function ConfigRoutingRule({
  params = {},
  setParams = () => {},
  setError = () => {},
  serviceTypes = [
    { name: 'Redirect', value: ROUTING_RULE_TYPES.REDIRECT },
    { name: 'Default - User will see the 404 page', value: ROUTING_RULE_TYPES.NONE },
    { name: 'Rewrite - Route traffic without redirect', value: ROUTING_RULE_TYPES.GENERAL_REWRITE },
    { name: 'Response - Response with provided content', value: ROUTING_RULE_TYPES.DIRECT_RESPONSE },
    { name: 'Component - Pass traffic to blocklet component', value: ROUTING_RULE_TYPES.COMPONENT },
  ],
}) {
  const { t } = useLocaleContext();
  const { blocklet } = useBlockletContext();
  const teamDid = blocklet.meta.did;
  const components = getComponents(blocklet);
  const [pageGroups, setPageGroups] = useState([]);

  const redirectCodesMap = {
    301: t('common.redirectPermanently'),
    302: t('common.redirectTemporary'),
    307: t('common.redirectTemporary'),
    308: t('common.redirectPermanently'),
  };

  useEffect(() => {
    if (params.type === ROUTING_RULE_TYPES.COMPONENT && params.componentId) {
      const component = components.find((x) => x.meta.did === params.componentId);
      const webInterface = findWebInterface(component.meta);
      const groups = (Array.isArray(webInterface?.pageGroups) ? webInterface.pageGroups : []).map((x) => ({
        value: x,
        label: `${x} pages`,
      }));
      if (groups.length) {
        groups.unshift({ value: '', label: 'All pages' });
      }
      setPageGroups(groups);
      if (params.pageGroup && groups.find((x) => x.value === params.pageGroup) === false) {
        setParams({ ...params, pageGroups: '' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.componentId, params.type]);

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
        onChange={(e) => {
          setError('');
          setParams({
            ...params,
            type: e.target.value,
            did: e.target.value === ROUTING_RULE_TYPES.BLOCKLET ? teamDid : '',
            __disableConfirm: false,
          });
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
      {params.type === ROUTING_RULE_TYPES.REDIRECT && [
        <TextField
          select
          key="redirectCode"
          label={t('router.domain.add.redirect')}
          autoComplete="off"
          variant="outlined"
          name="type"
          fullWidth
          value={params.redirectCode}
          onChange={(e) => setParams({ ...params, redirectCode: e.target.value })}
          style={{ marginBottom: 32 }}
          slotProps={{
            select: {},
          }}>
          {Object.keys(redirectCodesMap).map((code) => (
            <MenuItem key={code} value={code}>
              {`${redirectCodesMap[code]} - ${code}`}
            </MenuItem>
          ))}
        </TextField>,
        <TextField
          key="redirectUrl"
          label={t('common.redirectUrl')}
          autoComplete="off"
          variant="outlined"
          name="url"
          fullWidth
          value={params.url}
          helperText={t('router.urlHelperText')}
          style={{ marginBottom: 32 }}
          onChange={(e) => {
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
      {params.type === ROUTING_RULE_TYPES.COMPONENT &&
        [
          <TextField
            select
            key="componentId"
            label={t('router.domain.add.component')}
            autoComplete="off"
            variant="outlined"
            data-cy="select-component-input"
            name="componentId"
            fullWidth
            value={params.componentId}
            onChange={(e) => {
              setParams({
                ...params,
                componentId: e.target.value,
              });
            }}
            style={{ marginBottom: 32 }}
            slotProps={{
              select: {},
            }}>
            {components.map((component) => (
              <MenuItem
                key={component.meta.did}
                value={component.meta.did}
                selected={component.meta.did === params.componentId}>
                {getDisplayName(component, true)}
              </MenuItem>
            ))}
          </TextField>,
          pageGroups.length ? (
            <TextField
              key="pageGroup"
              select
              label={t('router.domain.add.pageGroup')}
              autoComplete="off"
              variant="outlined"
              name="pageGroup"
              data-cy="route-group-input"
              fullWidth
              value={params.pageGroup}
              helperText={t('router.domain.add.pageGroupTip')}
              style={{ marginBottom: 32 }}
              onChange={(e) => {
                setParams({ ...params, pageGroup: e.target.value });
              }}
              slotProps={{
                select: {},
              }}>
              {pageGroups.map((x) => (
                <MenuItem key={x.label} value={x.value} selected={x.value === params.pageGroup}>
                  {x.label}
                </MenuItem>
              ))}
            </TextField>
          ) : null,
        ].filter(Boolean)}
      {params.type === ROUTING_RULE_TYPES.GENERAL_REWRITE && (
        <TextField
          key="url"
          label={t('common.rewriteUrl')}
          autoComplete="off"
          variant="outlined"
          name="url"
          data-cy="rewrite-url-input"
          fullWidth
          value={params.url}
          helperText={t('router.urlHelperText')}
          style={{ marginBottom: 32 }}
          onChange={(e) => {
            const value = e.target.value.trim();
            setParams({ ...params, url: e.target.value, __disableConfirm: !value });
            if (!value) {
              setError(t('router.validation.rewriteUrlRequired'));
            } else {
              setError('');
            }
          }}
        />
      )}
      {params.type === ROUTING_RULE_TYPES.DIRECT_RESPONSE && [
        <TextField
          select
          key="responseType"
          label={t('router.rule.add.responseType')}
          autoComplete="off"
          variant="outlined"
          name="responseType"
          fullWidth
          value={params.responseType}
          onChange={(e) => setParams({ ...params, responseType: e.target.value })}
          style={{ marginBottom: 32 }}
          slotProps={{
            select: {},
          }}>
          {ROUTING_RESPONSE_TYPES.map((x) => (
            <MenuItem key={x.value} value={x.value}>
              {x.text}
            </MenuItem>
          ))}
        </TextField>,
        <TextField
          key="response-body"
          label={t('router.rule.add.responseBody')}
          autoComplete="off"
          variant="outlined"
          name="responseBody"
          data-cy="response-body-input"
          fullWidth
          multiline
          minRows={3}
          value={params.responseBody}
          helperText={t('router.rule.add.responseBodyTip')}
          style={{ marginBottom: 32 }}
          onChange={(e) => {
            const value = e.target.value.trim();
            setParams({ ...params, responseBody: e.target.value, __disableConfirm: !value });
            if (!value) {
              setError(t('router.rule.add.responseBodyRequired'));
            } else {
              setError('');
            }
          }}
        />,
      ]}
    </>
  );
}

ConfigRoutingRule.propTypes = {
  params: PropTypes.object,
  serviceTypes: PropTypes.array,
  setParams: PropTypes.func,
  setError: PropTypes.func,
};
