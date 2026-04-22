import Button from '@arcblock/ux/lib/Button';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { isInProgress } from '@blocklet/meta/lib/util';
import { Typography, Paper } from '@mui/material';
import { useNodeContext } from '../../contexts/node';
import { getSystemDomains, sortDomains } from '../../util';
import AddDomainAlias from '../router/action/add-domain-alias';
import BuyDidDomain from '../router/action/buy-did-domain';
import { ConflictDomainProvider } from '../router/hook';

export default function DomainActionCard({
  blocklet,
  bugDidDomainProps = {},
  connectDomainProps = {},
  updateBlockletDomainAliases = () => {},
}) {
  const { t } = useLocaleContext();
  const { info } = useNodeContext();
  const isMobile = useMediaQuery((x) => x.breakpoints.down('md'));

  const { site } = blocklet;

  const domains = useMemo(() => sortDomains(blocklet.site?.domainAliases), [blocklet.site?.domainAliases]);
  const appPk = blocklet.environments?.find((x) => x.key === 'BLOCKLET_APP_PK')?.value;
  const systemDomains = getSystemDomains(domains);

  return (
    <ConflictDomainProvider>
      <DomainCard
        action={
          <Box
            sx={{
              display: 'flex',
              alignItems: isMobile ? 'stretch' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 1,
            }}>
            {info.nftDomainUrl && (
              <BuyDidDomain
                variant="contained"
                appId={blocklet.appPid}
                appPk={appPk}
                siteId={site.id}
                inBlockletSetup={false}
                teamDid={blocklet.meta.did}
                onAddDomainAlias={(data) => {
                  const newDomainAlias = {
                    value: data.domainAlias,
                    isProtected: false,
                    type: data.type,
                    nftDid: data.nftDid,
                    chainHost: data.chainHost,
                    accessibility: { loading: true },
                  };

                  updateBlockletDomainAliases(newDomainAlias);
                }}
                {...bugDidDomainProps}
              />
            )}

            <AddDomainAlias
              id={site.id}
              title={t('common.connectExistingDomain')}
              teamDid={blocklet.meta?.did}
              appId={blocklet.appPid}
              appPk={appPk}
              systemDomains={systemDomains?.map((x) => x.value)}
              onAddDomainAlias={(data) => {
                const newDomainAlias = {
                  value: data.domain,
                  isProtected: false,
                  type: data.type === 'nftDomain' ? 'nft-domain' : '',
                  nftDid: data.nftDid,
                  chainHost: data.chainHost,
                  accessibility: { loading: true },
                  canGenerateCertificate:
                    data.canGenerateCertificate === undefined ? true : data.canGenerateCertificate,
                };

                updateBlockletDomainAliases(newDomainAlias);
              }}
              {...connectDomainProps}>
              {({ open }) => (
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: '#ddd',
                    color: 'text.primary',
                    '&:hover': {
                      bgcolor: (theme) => theme.palette.primary.main,
                      color: (theme) => theme.palette.primary.contrastText,
                    },
                  }}
                  data-cy="add-domain-alias"
                  onClick={open}
                  disabled={isInProgress(blocklet.status)}>
                  <AddIcon style={{ fontSize: '1.3em', marginRight: 4 }} />
                  {t('common.connectExistingDomain')}
                </Button>
              )}
            </AddDomainAlias>
          </Box>
        }
      />
    </ConflictDomainProvider>
  );
}

DomainActionCard.propTypes = {
  blocklet: PropTypes.object.isRequired,
  bugDidDomainProps: PropTypes.object,
  connectDomainProps: PropTypes.object,
  updateBlockletDomainAliases: PropTypes.func,
};

function DomainCard({ action }) {
  const { t } = useLocaleContext();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1, width: 0, mb: 1.5 }}>
          <Typography variant="h6">{t('common.bugOrConnectDomain')}</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
            {t('common.bugOrConnectDomainTip')}
          </Typography>
        </Box>

        {/* <Box
          sx={{
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Box component="img" src={DID_DOMAIN_LOGO} alt="did-domain" sx={{ width: 80, height: 80 }} />
        </Box> */}
      </Box>

      {action}
    </Paper>
  );
}

DomainCard.propTypes = {
  action: PropTypes.element.isRequired,
};
