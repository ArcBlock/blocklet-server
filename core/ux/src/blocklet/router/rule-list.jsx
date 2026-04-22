import React from 'react';
import PropTypes from 'prop-types';
import isUrl from 'is-url';
import trimEnd from 'lodash/trimEnd';
import { useTheme } from '@mui/material/styles';

import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import ExternalLink from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import LockIcon from '@arcblock/icons/lib/LockIcon';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { ROUTING_RESPONSE_TYPES, ROUTING_RULE_TYPES } from '@abtnode/constant';
import { getDisplayName } from '@blocklet/meta/lib/util';

import { TextSnippetOutlined } from '@mui/icons-material';
import { getBlockletUrlParams, getAccessUrl, BlockletAdminRoles } from '../../util';
import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';
import { withPermission } from '../../permission';
import Line from '../component/line';
import RuleActions from './rule-actions';
import BlockletPageGroup from '../page-group';

function RedirectRule({ domain, isHttps = false, toUrl }) {
  const scheme = isHttps ? 'https' : 'http';
  let tmpToUrl = toUrl;
  if (!isUrl(tmpToUrl)) {
    tmpToUrl = `${scheme}://${domain}${toUrl}`;
  }

  return (
    <ExternalLink key={tmpToUrl} href={tmpToUrl} target="_blank" style={{ fontSize: 14 }} underline="hover">
      {toUrl}
    </ExternalLink>
  );
}

RedirectRule.propTypes = {
  domain: PropTypes.string.isRequired,
  toUrl: PropTypes.string.isRequired,
  isHttps: PropTypes.bool,
};

function RuleList({ hasPermission = false }) {
  const { t, locale } = useLocaleContext();
  const theme = useTheme();
  const { blocklet, recommendedDomain: domain } = useBlockletContext();

  const rules = blocklet.site.rules.filter((rule) => rule.to.type !== ROUTING_RULE_TYPES.BLOCKLET);

  return rules.map((rule) => {
    let avatar = null;
    let component = null;
    if (rule.to.type === ROUTING_RULE_TYPES.NONE) {
      avatar = '404';
    } else if (rule.to.type === ROUTING_RULE_TYPES.REDIRECT) {
      avatar = rule.to.redirectCode;
    } else if (rule.to.type === ROUTING_RULE_TYPES.GENERAL_REWRITE) {
      avatar = 'R';
    } else if (rule.to.type === ROUTING_RULE_TYPES.DIRECT_RESPONSE) {
      avatar = <TextSnippetOutlined sx={{ color: 'text.secondary', fontSize: '45px' }} />;
    } else if (rule.to.type === ROUTING_RULE_TYPES.COMPONENT) {
      component = blocklet.children.find((x) => x.meta.did === rule.to.componentId);
      avatar = 'C';
    }

    const action = rule.isProtected ? (
      <Tooltip title={t('blocklet.router.urlLockTooltip')} placement="top">
        <span>
          <IconButton
            disabled
            size="small"
            style={{
              pointerEvents: 'auto',
              // padding replace to margin, fix the tooltip position
              paddingTop: 0,
              paddingBottom: 0,
              margin: '12px 0',
            }}>
            <LockIcon style={{ fill: theme.palette.text.disabled }} />
          </IconButton>
        </span>
      </Tooltip>
    ) : (
      <RuleActions {...rule} />
    );

    return [
      <Box
        key="rule"
        className="component-item"
        sx={{
          display: 'flex',
          py: 2,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Box
          sx={{
            width: { xs: 300, md: 400 },
            display: 'flex',
            alignItems: 'center',
          }}>
          <Box
            className="component-item__indent"
            sx={{
              width: 28,
            }}
          />
          {typeof avatar === 'object' ? avatar : <Avatar>{avatar}</Avatar>}
          <Box
            sx={{
              ml: 2,
              flex: 1,
              wordBreak: 'break-word',
            }}>
            <Box style={{ color: 'text.primary', fontSize: 16 }}>
              {rule.to.type === ROUTING_RULE_TYPES.NONE && t('common.page404')}
              {rule.to.type === ROUTING_RULE_TYPES.REDIRECT && t('common.redirect')}
              {rule.to.type === ROUTING_RULE_TYPES.GENERAL_REWRITE && t('common.rewrite')}
              {rule.to.type === ROUTING_RULE_TYPES.DIRECT_RESPONSE &&
                ROUTING_RESPONSE_TYPES.find((x) => x.value === rule.to.response.contentType)?.text}
              {rule.to.type === ROUTING_RULE_TYPES.COMPONENT && getDisplayName(component, true)}
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}>
              {rule.to.type === ROUTING_RULE_TYPES.REDIRECT && <RedirectRule domain={domain} toUrl={rule.to.url} />}
              {rule.to.type === ROUTING_RULE_TYPES.GENERAL_REWRITE && (
                <RedirectRule domain={domain} toUrl={rule.to.url} />
              )}
              {rule.to.type === ROUTING_RULE_TYPES.COMPONENT && <BlockletPageGroup group={rule.to.pageGroup} />}
            </Box>
          </Box>
        </Box>

        <Box
          key={rule.from.pathPrefix}
          sx={{
            px: 2,
            alignItems: 'center',
            flexGrow: '1',
            display: { xs: 'none', md: 'flex' },
          }}>
          <ExternalLink
            href={getAccessUrl(domain, rule.from.pathPrefix, getBlockletUrlParams(blocklet, locale))}
            target="_blank"
            style={{ fontSize: 16, color: 'inherit' }}
            underline="hover">
            {trimEnd(rule.from.pathPrefix, '/') || '/'}
          </ExternalLink>
        </Box>

        <Box key="actions">{hasPermission && <div style={{ textAlign: 'right' }}>{action}</div>}</Box>
      </Box>,
      <Line key="divider" />,
    ];
  });
}

RuleList.propTypes = {
  hasPermission: PropTypes.bool,
};

const RuleListInDaemon = withPermission(RuleList, 'mutate_blocklets');
const RuleListInService = withPermission(RuleList, '', BlockletAdminRoles);

export default function RuleListWithPermission(props) {
  const { inService } = useNodeContext();
  if (inService) {
    return <RuleListInService {...props} />;
  }

  return <RuleListInDaemon {...props} />;
}
