/* eslint-disable no-inner-declarations */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable no-script-url */
/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable react/require-default-props */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import isUrl from 'is-url';
import { styled } from '@mui/material/styles';

import OkIcon from '@mui/icons-material/CheckCircle';
import BadIcon from '@mui/icons-material/Error';
import NodeIcon from '@mui/icons-material/Storage';
import DomainIcon from '@mui/icons-material/Public';
import RuleIcon from '@mui/icons-material/SubdirectoryArrowRight';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ExternalLink from '@mui/material/Link';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { ROUTING_RULE_TYPES, BLOCKLET_SITE_GROUP_SUFFIX } from '@abtnode/constant';
import { getDisplayName, isBlockletRunning } from '@blocklet/meta/lib/util';

import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getAccessUrl, sortDomains } from '@abtnode/ux/lib/util';
import BlockletStatus from '@abtnode/ux/lib/blocklet/status';

import { DASHBOARD, DOMAIN_FOR_DEFAULT_SITE } from '../../../contexts/routing';
import { useBlockletsContext } from '../../../contexts/blocklets';
import { useNodeContext } from '../../../contexts/node';
import { useDomainStatusContext } from '../../../contexts/domain-status';

import RuleItemAction from './action';
import DomainStatus from './domain-status';
import Permission from '../../permission';
import AddCert from './action/add-cert';
import DeleteDomainAlias from './action/delete-domain-alias';

function RedirectRule({ domain, isHttps = false, toUrl }) {
  const scheme = isHttps ? 'https' : 'http';
  const { t } = useLocaleContext();
  let tmpToUrl = toUrl;
  if (!isUrl(tmpToUrl)) {
    tmpToUrl = `${scheme}://${domain}${toUrl}`;
  }

  return (
    <>
      <Typography className="arrow-name-middle">{t('common.redirect')}</Typography>
      <span className="arrow-name-arrow">⟶</span>
      <ExternalLink key={tmpToUrl} href={tmpToUrl} target="_blank" underline="hover">
        {toUrl}
      </ExternalLink>
    </>
  );
}

RedirectRule.propTypes = {
  domain: PropTypes.string.isRequired,
  toUrl: PropTypes.string.isRequired,
  isHttps: PropTypes.bool,
};

function NoneRule() {
  const { t } = useLocaleContext();

  return <Typography className="arrow-name-middle">{t('common.page404')}</Typography>;
}

export default function RuleItem({
  id = '',
  type = '',
  name = '',
  title = '',
  items = [],
  depth = 0,
  to = {},
  expand: initialExpand = true,
  isProtected = false,
  pathPrefix = '',
  parent = {},
  domainAliases = [],
  ...rest
}) {
  const props = {
    id,
    type,
    name,
    title,
    items,
    depth,
    to,
    expand: initialExpand,
    isProtected,
    pathPrefix,
    parent,
    domainAliases,
    ...rest,
  };
  const { t } = useLocaleContext();
  const { data } = useBlockletsContext();
  const { info } = useNodeContext();
  const { status: domainsStatus } = useDomainStatusContext();

  const blocklets = data.map(x => ({
    meta: {
      did: x.meta.did,
      name: getDisplayName(x, true),
      version: x.meta.version,
      interfaces: x.meta.interfaces,
    },
    port: x.port,
    ports: x.ports,
    status: x.status,
  }));

  let siteName = name;
  const isBlockletSite = name.endsWith(BLOCKLET_SITE_GROUP_SUFFIX);

  let ruleActionType = type;
  if (name === DASHBOARD) {
    ruleActionType = 'dashboard_domain';
  }
  if (isBlockletSite) {
    ruleActionType = 'blocklet_domain';
  }

  const [expand, setExpand] = useState(initialExpand);

  const icons = {
    root: NodeIcon,
    domain: DomainIcon,
    rule: RuleIcon,
  };

  const IconComponent = icons[type];
  const style = { paddingBottom: 8, paddingLeft: 8 };

  if (type === 'domain') {
    // hide system common site
    if (isProtected && !isBlockletSite) {
      return null;
    }

    if (isBlockletSite) {
      const did = name.replace(BLOCKLET_SITE_GROUP_SUFFIX, '');
      const blocklet = blocklets.find(x => x.meta.did === did);
      if (!blocklet) {
        return null;
      }

      // hide external blocklet site
      if (blocklet.controller) {
        return null;
      }

      siteName = blocklet.meta.title || blocklet.meta.name;
    }

    function DomainLink({ domain, primaryDomain, rules }) {
      let url = getAccessUrl(domain);
      if (primaryDomain === DASHBOARD) {
        url = `${url}/${info.routing.adminPath.replace(/^\/+/, '')}`;
      } else if (rules && rules.length && rules[0].pathPrefix) {
        url = `${url}/${rules[0].pathPrefix.replace(/^\/+/, '')}`;
      }

      if (domain !== DASHBOARD) {
        return (
          <DomainElement href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
            {domain}
          </DomainElement>
        );
      }
      return domain;
    }

    DomainLink.propTypes = {
      domain: PropTypes.string.isRequired,
      primaryDomain: PropTypes.string.isRequired,
      rules: PropTypes.array.isRequired,
    };

    const onRuleAdded = () => {
      setExpand(true);
    };

    let domains = (domainAliases || []).filter(item => item.value !== name);
    domains = sortDomains(domains);

    return [
      <ItemDiv alignItems="flex-start" button key="parent" disableGutters data-cy="rule-domain">
        {!isBlockletSite && (
          <ListItemIcon onClick={() => setExpand(d => !d)}>
            {items.length > 0 && (expand ? <ExpandMoreIcon /> : <ChevronRightIcon />)}
            <IconComponent style={{ fontSize: 22 }} />
          </ListItemIcon>
        )}
        {isBlockletSite && (
          <ListItemIcon>
            <IconComponent style={{ fontSize: 22 }} />
          </ListItemIcon>
        )}
        <ListItemText
          onClick={() => setExpand(d => !d)}
          className={`rule-name rule-name--depth${depth}`}
          style={{ flex: 1 }}
          secondary={items.length <= 0 ? <span className="site-secondary">{t('router.empty')}</span> : ''}
          primary={
            <>
              <div className="site-header">
                {/* default site */}
                {name === DOMAIN_FOR_DEFAULT_SITE && t('router.defaultSite')}
                {/* dashboard site */}
                {name !== DOMAIN_FOR_DEFAULT_SITE && !isBlockletSite && (
                  <DomainLink domain={name} primaryDomain={name} rules={items} />
                )}
                {/* blocklet site */}
                {isBlockletSite && siteName}

                {items.length && !expand ? <span style={{ marginLeft: 5 }}>{`(${items.length} URL)`}</span> : null}
                <span style={{ marginLeft: 12 }} />
                {type === 'domain' && name !== DOMAIN_FOR_DEFAULT_SITE && name !== DASHBOARD && !isBlockletSite && (
                  <>
                    <DomainStatus key={name} type={type} name={name} />
                    <span style={{ marginLeft: 12 }} />
                    <AddCert siteId={id} domain={name}>
                      {({ open }) => (
                        <Button size="small" onClick={e => open(e)}>
                          {t('router.cert.genLetsEncryptCert.title')}
                        </Button>
                      )}
                    </AddCert>
                  </>
                )}
              </div>
              {domains.map(item => {
                const domain = typeof item !== 'string' ? item.value : item;

                return (
                  <div key={domain} className="site-alias">
                    <DomainLink domain={domain} primaryDomain={name} rules={items} />
                    <span style={{ marginLeft: 12 }} />
                    <DomainStatus key={`domain-status-${name}`} type={type} name={domain} />
                    <AddCert siteId={id} domain={domain}>
                      {({ open }) => (
                        <Button size="small" onClick={e => open(e)}>
                          {t('router.cert.genLetsEncryptCert.title')}
                        </Button>
                      )}
                    </AddCert>
                    {!item.isProtected && <DeleteDomainAlias key="delete-domain-alias" id={props.id} domain={domain} />}
                    {domain !== DASHBOARD && domain !== window.location.hostname && (
                      <RuleItemAction
                        key={`action-${name}`}
                        {...props}
                        domain={domain}
                        type="domainAlias"
                        onRuleAdded={onRuleAdded}
                      />
                    )}
                  </div>
                );
              })}
            </>
          }
        />

        <Permission permission="mutate_router">
          <ListItemSecondaryAction>
            <RuleItemAction
              blocklets={blocklets}
              key={name}
              {...props}
              onRuleAdded={onRuleAdded}
              type={ruleActionType}
            />
          </ListItemSecondaryAction>
        </Permission>
      </ItemDiv>,
      // Do not render rules for blocklet site
      !isBlockletSite && items.length > 0 && (
        <Collapse key="rules" in={expand}>
          <List key="children" component="div" className={`rule-list rule-list--depth${depth}`} disablePadding>
            {items.map(x => (
              <RuleItem key={x.id} {...x} parent={props} depth={depth + 1} />
            ))}
          </List>
        </Collapse>
      ),
    ];
  }

  // We have no rules: just the root node with no children
  if (type === 'root') {
    return [
      <ItemDiv key="root" disableGutters data-cy="rule-root">
        <ListItemIcon>
          <IconComponent style={{ fontSize: 22 }} />
        </ListItemIcon>
        <ListItemText primary={name} />
        <Permission permission="mutate_router">
          <ListItemSecondaryAction>
            <RuleItemAction blocklets={blocklets} {...props} />
          </ListItemSecondaryAction>
        </Permission>
      </ItemDiv>,
      items.length > 0 && (
        <List key="children" component="div" className={`rule-list rule-list--depth${depth}`} disablePadding>
          {items.map(x => (
            <RuleItem expand={!isProtected} key={x.id} {...x} parent={props} depth={depth + 1} />
          ))}
        </List>
      ),
    ];
  }

  // Then we must render the leaf node
  let internalLink = `/blocklets/${to.did}/overview`;
  if (to.type === ROUTING_RULE_TYPES.DAEMON) {
    internalLink = '/';
  }

  const dashboard = {
    meta: { did: info.did, name: 'Blocklet Server Dashboard', version: info.version },
    status: 'running',
    port: info.port,
  };

  const blocklet = to.did === info.did ? dashboard : blocklets.find(x => x.meta.did === to.did);
  const isHealthy = isBlockletRunning(blocklet) || to.type === ROUTING_RULE_TYPES.DAEMON;
  const healthyTip = isHealthy ? t('router.healthy.ok') : t('router.healthy.error');

  const domainStatus = domainsStatus[parent.name] || {};

  return (
    <ItemDiv className="hover-item" divider key={name} disableGutters style={style} data-cy="rule-item">
      <ListItemIcon className="arrow-icon">
        <IconComponent style={{ fontSize: 22 }} />
      </ListItemIcon>
      <ListItemText
        primary={
          /* eslint-disable-next-line react/jsx-wrap-multilines */
          <Typography component="div" className="arrow-name">
            <Typography style={{ wordBreak: 'break-all' }} className="arrow-name-left">
              {name}
            </Typography>
            <span className="arrow-name-arrow">⟶</span>
            {(to.type === ROUTING_RULE_TYPES.DAEMON || to.type === ROUTING_RULE_TYPES.BLOCKLET) && (
              <>
                {parent.name !== DOMAIN_FOR_DEFAULT_SITE && isHealthy && (
                  <Box className="arrow-name-middle">
                    <ExternalLink href={getAccessUrl(parent.name, pathPrefix)} target="_blank" underline="hover">
                      {t('common.open')}
                    </ExternalLink>
                  </Box>
                )}
                {parent.name === DOMAIN_FOR_DEFAULT_SITE && (
                  <Typography component="span" className="arrow-name-middle">
                    Blocklet
                  </Typography>
                )}
                {!isHealthy && <span className="arrow-name-middle">{t('common.unavailable')}</span>}
                <span className="arrow-name-arrow">⟶</span>
                <Link to={internalLink} className="arrow-name-right">
                  <Tooltip title={healthyTip}>
                    {isHealthy ? (
                      <OkIcon style={{ color: '#44cdc6', fontSize: 20 }} />
                    ) : (
                      <BadIcon style={{ color: 'red', fontSize: 20 }} />
                    )}
                  </Tooltip>
                  <span>{blocklet ? blocklet.meta.name : title}</span>
                  {blocklet && (
                    <span style={{ marginLeft: 8 }}>
                      <BlockletStatus status={blocklet.status} progress={blocklet.progress} />
                    </span>
                  )}
                </Link>
              </>
            )}
            {to.type === ROUTING_RULE_TYPES.REDIRECT && (
              <RedirectRule prefix={pathPrefix} domain={parent.name} toUrl={to.url} isHttps={domainStatus.isHttps} />
            )}
            {to.type === ROUTING_RULE_TYPES.NONE && <NoneRule />}
          </Typography>
        }
      />
      <Permission permission="mutate_router">
        <ListItemSecondaryAction>
          <RuleItemAction blocklets={blocklets} {...props} did={to.did} />
        </ListItemSecondaryAction>
      </Permission>
    </ItemDiv>
  );
}

RuleItem.propTypes = {
  type: PropTypes.string.isRequired,
  to: PropTypes.object,
  name: PropTypes.string.isRequired,
  title: PropTypes.string,
  id: PropTypes.string,
  items: PropTypes.array,
  parent: PropTypes.object,
  depth: PropTypes.number,
  expand: PropTypes.bool,
  isProtected: PropTypes.bool,
  pathPrefix: PropTypes.string,
  domainAliases: PropTypes.array,
};

const ItemDiv = styled(ListItem)`
  .MuiListItemText-root {
    padding-right: 48px;
  }
  .MuiListItemSecondaryAction-root {
    right: 0;
  }
  .site-header {
    display: unset !important;
    vertical-align: middle;
    .MuiSvgIcon-root {
      vertical-align: middle;
    }
  }
`;

const DomainElement = styled('a')`
  color: ${({ theme }) => theme.palette.text.secondary};
  white-space: normal;
  word-break: break-all;
  :hover {
    color: ${({ theme }) => theme.palette.text.primary};
  }
`;
