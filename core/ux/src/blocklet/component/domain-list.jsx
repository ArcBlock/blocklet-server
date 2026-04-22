/* eslint-disable react/require-default-props */

import Button from '@arcblock/ux/lib/Button';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import trim from 'lodash/trim';
import React, { useCallback, useMemo, useState } from 'react';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Spinner from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import Empty from '@arcblock/ux/lib/Empty';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { CopyButton } from '@arcblock/ux/lib/ClickToCopy';
import { Domain as DomainComponent } from '@blocklet/did-domain-react';
import { Typography, Paper, Stack, useTheme } from '@mui/material';
import { isCustomDomain } from '@abtnode/util/lib/url-evaluation';
import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';
import { withPermission } from '../../permission';
import { BlockletAdminRoles, sortDomains } from '../../util';
import AddCert from '../add-cert';
import DomainActions from '../router/domain-actions';
import DomainStatus from '../router/domain-status';
import { DomainType } from '../types';
import { isServerless } from '../util';

const BlockletComponent = withPermission(DomainList, 'mutate_blocklets');
const BlockletInServiceComponent = withPermission(DomainList, '', BlockletAdminRoles);

export default function DomainListWithPermission(props) {
  const { inService } = useNodeContext();
  const { blocklet, loadingRuntimeInfo } = useBlockletContext();

  let Component = BlockletComponent;

  if (inService) {
    Component = BlockletInServiceComponent;
  }

  return <Component {...props} blocklet={blocklet} inService={inService} loadingRuntimeInfo={loadingRuntimeInfo} />;
}

const DIDDomainType = 'nft-domain';
const DIDDomainForwardingType = 'nft-domain-forwarding';
function DomainList({
  hasPermission = false,
  blocklet,
  loadingRuntimeInfo = false,
  inService = false,
  showAllDomains = false,
  updateBlockletDomainAliases = () => {},
  systemTips = null,
}) {
  const { t } = useLocaleContext();
  const isMobile = useMediaQuery((x) => x.breakpoints.down('md'));

  const hasMutatePermission = useMemo(() => {
    let res = hasPermission;
    if (isServerless(blocklet)) {
      res = res && inService;
    }

    return res;
  }, [hasPermission, inService, blocklet]);

  const { site } = blocklet;

  const domains = useMemo(() => sortDomains(blocklet.site?.domainAliases), [blocklet.site?.domainAliases]);
  const systemDomains = useMemo(() => domains.filter((domain) => !isCustomDomain(domain.value)), [domains]);
  const customDomains = useMemo(() => domains.filter((domain) => isCustomDomain(domain.value)), [domains]);
  const manualDomains = useMemo(
    () => customDomains.filter((domain) => domain.type !== DIDDomainType && domain.type !== DIDDomainForwardingType),
    [customDomains]
  );
  const DIDDomains = useMemo(() => customDomains.filter((domain) => domain.type === DIDDomainType), [customDomains]);
  const forwardingDomains = useMemo(
    () => customDomains.filter((domain) => domain.type === DIDDomainForwardingType),
    [customDomains]
  );

  return (
    <>
      <Stack
        sx={{
          gap: 3,
        }}>
        {!!DIDDomains.length && (
          <DomainURLCard
            title={t('common.didDomains')}
            description={t('common.didDomainsDescription')}
            domains={DIDDomains}
            hasMutatePermission={hasMutatePermission}
            blocklet={blocklet}
            site={site}
            mobile={isMobile}
            showAllDomains={showAllDomains}
            updateBlockletDomainAliases={updateBlockletDomainAliases}
          />
        )}

        {!!forwardingDomains.length && (
          <DomainURLCard
            title={t('common.forwardingDomains')}
            description={t('common.forwardingDomainsDescription')}
            domains={forwardingDomains}
            hasMutatePermission={hasMutatePermission}
            blocklet={blocklet}
            site={site}
            mobile={isMobile}
            showAllDomains={showAllDomains}
            updateBlockletDomainAliases={updateBlockletDomainAliases}
          />
        )}

        {!!manualDomains.length && (
          <DomainURLCard
            title={t('common.manualDomains')}
            description={t('common.manualDomainsDescription')}
            domains={manualDomains}
            hasMutatePermission={hasMutatePermission}
            blocklet={blocklet}
            site={site}
            mobile={isMobile}
            showAllDomains={showAllDomains}
            updateBlockletDomainAliases={updateBlockletDomainAliases}
          />
        )}

        {!!systemDomains.length && (
          <Box>
            {systemTips}
            <DomainURLCard
              title={t('common.systemDomains')}
              description={t('common.systemDomainsDescription')}
              domains={systemDomains}
              hasMutatePermission={hasMutatePermission}
              blocklet={blocklet}
              site={site}
              mobile={isMobile}
              updateBlockletDomainAliases={updateBlockletDomainAliases}
            />
          </Box>
        )}
      </Stack>
      {!domains.length && (loadingRuntimeInfo ? <Spinner size={16} /> : <Empty>{t('common.empty')}</Empty>)}
    </>
  );
}

DomainList.propTypes = {
  hasPermission: PropTypes.bool,
  blocklet: PropTypes.object.isRequired,
  loadingRuntimeInfo: PropTypes.bool,
  inService: PropTypes.bool.isRequired,
  showAllDomains: PropTypes.bool,
  updateBlockletDomainAliases: PropTypes.func,
  systemTips: PropTypes.node,
};

function DomainLinkSuffix({ children = null }) {
  return (
    <Box component="span" sx={{ verticalAlign: 'bottom' }}>
      {children}
    </Box>
  );
}
DomainLinkSuffix.propTypes = {
  children: PropTypes.node,
};

function DomainLink({ domain, children, suffix = null, ...rest }) {
  const { t, locale } = useLocaleContext();
  const theme = useTheme();

  const { href, accessibility, value: domainValue } = domain;

  const renderCopyButton = useCallback(() => {
    return (
      <CopyButton
        content={trim(domainValue)}
        locale={locale}
        style={{ marginLeft: '4px', color: theme.palette.text.secondary, fontSize: '0.8em' }}
      />
    );
  }, [domainValue, locale, theme]);

  if (!accessibility || accessibility.loading) {
    return (
      <LinkDiv component="span" {...rest}>
        <Tooltip title={undefined} placement="top-end">
          <Box component="span">{children}</Box>
        </Tooltip>

        {renderCopyButton()}

        <DomainLinkSuffix>{suffix}</DomainLinkSuffix>

        <Tooltip title={t('blocklet.router.checkUrlAccessible')} placement="top-end">
          <Box component="span" className="status">
            <Spinner size={13} style={{ fontSize: '13px' }} />
          </Box>
        </Tooltip>
      </LinkDiv>
    );
  }

  if (!accessibility.accessible) {
    return (
      <LinkDiv component="span" {...rest}>
        <Tooltip title={t('blocklet.router.urlInaccessible')} placement="top-end">
          <Box component="span">{children}</Box>
        </Tooltip>

        {!domain.loading && renderCopyButton()}

        <DomainLinkSuffix>{suffix}</DomainLinkSuffix>
      </LinkDiv>
    );
  }

  return (
    <LinkDiv component="span" {...rest}>
      <Box
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ color: domain.loading ? 'text.disabled' : undefined }}>
        <Tooltip title={undefined} placement="top-end">
          <Box component="span">{children}</Box>
        </Tooltip>
      </Box>

      {renderCopyButton()}

      <DomainLinkSuffix>{suffix}</DomainLinkSuffix>
    </LinkDiv>
  );
}

DomainLink.propTypes = {
  domain: DomainType.isRequired,
  children: PropTypes.any.isRequired,
  suffix: PropTypes.node,
};

const LinkDiv = styled(Box)`
  display: inline-block;
  vertical-align: middle;

  & > span {
    line-height: 24px;
  }

  &,
  & > * {
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 18px;
  }

  &,
  & > * {
    word-break: break-all;
  }

  svg {
    vertical-align: text-top;
  }

  .status {
    margin-left: 8px;
    font-size: 13px;
  }
`;

function InnerAction({ hasMutatePermission, site, domain, blocklet, onDelete }) {
  if (hasMutatePermission && !domain.isProtected) {
    return <DomainActions site={site} domain={domain} blocklet={blocklet} onDelete={onDelete} />;
  }

  return null;
}

InnerAction.propTypes = {
  hasMutatePermission: PropTypes.bool.isRequired,
  site: PropTypes.object.isRequired,
  domain: DomainType.isRequired,
  blocklet: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function InnerAddDomain({ siteId, domain, blocklet, hasMutatePermission }) {
  const { info } = useNodeContext();
  const { t, locale } = useLocaleContext();
  const [issuing, setIssuing] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 0.5,
        button: {
          lineHeight: 1,
        },
      }}>
      {domain.type === 'nft-domain' && (
        <DomainComponent locale={locale} nftDid={domain.nftDid} didDomainURL={info.nftDomainUrl} />
      )}
      <Box
        sx={{
          display: 'flex',
          mt: '-1px',
        }}>
        <DomainStatus key={`${domain.value}-http`} domain={domain} filters={['http']} />
      </Box>
      {hasMutatePermission && domain.canGenerateCertificate && (
        <AddCert
          siteId={siteId}
          domain={domain.value}
          domainStatus={domain.domainStatus}
          did={blocklet.meta.did}
          issuing={issuing}
          setIssuing={setIssuing}>
          {({ open }) => (
            <Button sx={{ padding: 0 }} size="small" onClick={(e) => open(e)}>
              {t('router.cert.genLetsEncryptCert.title')}
            </Button>
          )}
        </AddCert>
      )}
    </Box>
  );
}

InnerAddDomain.propTypes = {
  siteId: PropTypes.string.isRequired,
  domain: DomainType.isRequired,
  blocklet: PropTypes.object.isRequired,
  hasMutatePermission: PropTypes.bool.isRequired,
};

function DomainURLCard({
  title,
  description,
  domains = [],
  hasMutatePermission,
  blocklet,
  site,
  mobile,
  showAllDomains = false,
  updateBlockletDomainAliases = () => {},
}) {
  const [expanded, setExpanded] = useState(false);
  const displayDomains = useMemo(() => {
    if (showAllDomains) {
      return domains;
    }

    return expanded ? domains : domains.slice(0, 1);
  }, [domains, expanded, showAllDomains]);

  const hasMoreDomains = domains.length > 1;
  const isProtectedDomain = (domain) => hasMutatePermission && !domain.isProtected;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        pb: showAllDomains ? 3 : 1.5,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'box-shadow 0.2s ease-in-out',
      }}>
      <Stack
        sx={{
          width: 1,
        }}>
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="h6">{title}</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>{description}</Typography>
        </Box>

        {displayDomains.map((domain, index) => (
          <Stack key={domain.value}>
            {index !== 0 && (
              <Box
                sx={{
                  my: 0.75,
                  width: 1,
                  height: '1px',
                }}
              />
            )}

            {!mobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                    <DomainStatus key={`${domain.value}-domain`} domain={domain} filters={['domain']} />
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: 0.5,
                      svg: { width: '1em', height: '1em' },
                      img: { width: '0.9em', height: '0.9em' },
                    }}>
                    <DomainLink domain={domain} target="_blank">
                      {domain.value}
                    </DomainLink>

                    <Box
                      sx={{
                        mt: '2px',
                      }}>
                      <InnerAddDomain
                        siteId={blocklet.site?.id}
                        domain={domain}
                        blocklet={blocklet}
                        hasMutatePermission={hasMutatePermission}
                      />
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ button: { padding: 0 } }}>
                  <InnerAction
                    hasMutatePermission={hasMutatePermission}
                    site={site}
                    domain={domain}
                    blocklet={blocklet}
                    onDelete={() => updateBlockletDomainAliases(domain, 'delete')}
                  />
                </Box>
              </Box>
            )}

            {mobile && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    gap: 1,
                  }}>
                  <Box
                    sx={{
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                    <DomainStatus key={`${domain.value}-domain`} domain={domain} filters={['domain']} />
                  </Box>

                  <DomainLink
                    domain={domain}
                    target="_blank"
                    suffix={
                      isProtectedDomain(domain) ? null : (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            svg: { width: '1em', height: '1rem' },
                            img: { width: '0.9rem', height: '0.9rem' },
                          }}>
                          <InnerAddDomain
                            siteId={blocklet.site?.id}
                            domain={domain}
                            blocklet={blocklet}
                            hasMutatePermission={hasMutatePermission}
                          />
                        </Box>
                      )
                    }>
                    {domain.value}
                  </DomainLink>
                </Box>

                {isProtectedDomain(domain) && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      ml: '18px',
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <InnerAddDomain
                        siteId={blocklet.site?.id}
                        domain={domain}
                        blocklet={blocklet}
                        hasMutatePermission={hasMutatePermission}
                      />
                    </Box>

                    <Box sx={{ button: { padding: 0 } }}>
                      <InnerAction
                        hasMutatePermission={hasMutatePermission}
                        site={site}
                        domain={domain}
                        blocklet={blocklet}
                        onDelete={() => updateBlockletDomainAliases(domain, 'delete')}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Stack>
        ))}

        {hasMoreDomains && !showAllDomains && (
          <Button onClick={() => setExpanded(!expanded)} sx={{ p: 0, mt: 0.5, alignSelf: 'center' }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

DomainURLCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  domains: PropTypes.array.isRequired,
  hasMutatePermission: PropTypes.bool.isRequired,
  blocklet: PropTypes.object.isRequired,
  site: PropTypes.object.isRequired,
  mobile: PropTypes.bool.isRequired,
  showAllDomains: PropTypes.bool,
  updateBlockletDomainAliases: PropTypes.func,
};
