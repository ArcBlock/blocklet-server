import styled from '@emotion/styled';
import React, { useState, useMemo } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { Icon } from '@iconify/react';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowDownRoundedIcon from '@iconify-icons/material-symbols/keyboard-arrow-down-rounded';
import KeyboardArrowUpRoundedIcon from '@iconify-icons/material-symbols/keyboard-arrow-up-rounded';
import AccountTreeRoundedIcon from '@iconify-icons/tabler/sitemap';
import GroupRoundedIcon from '@iconify-icons/tabler/users';
import BadgeRoundedIcon from '@iconify-icons/tabler/id-badge-2';
import LanguageRoundedIcon from '@iconify-icons/tabler/world-www';
import AccessTimeRoundedIcon from '@iconify-icons/tabler/clock';
import BackupRoundedIcon from '@iconify-icons/material-symbols/settings-backup-restore';
import PropTypes from 'prop-types';
import { format } from 'timeago.js';
import prettyMs from 'pretty-ms-i18n';
import dayjs from '@abtnode/util/lib/dayjs';
import { BACKUPS, WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { isCustomDomain } from '@abtnode/util/lib/url-evaluation';
import Button from '@arcblock/ux/lib/Button';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Tag from '@arcblock/ux/lib/Tag';
import Grid from '@mui/material/Grid';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import { joinURL } from 'ufo';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import { isBlockletRunning } from '@blocklet/meta/lib/util';

import { useBlockletContext } from '../contexts/blocklet';
import { useNodeContext } from '../contexts/node';
import { useTeamContext } from '../contexts/team';
import DidAddress from '../did-address';
import VaultStatus from './vault/status';
import Metric from '../component/metric';
import { getExplorerLink } from '../util';
import { isServerless } from './util';
import { getSpaceBackupEndpoint } from '../util/spaces';
import { useUpTime } from './uptime';

const WalletType = {
  arcblock: 'ArcBlock',
  ethereum: 'Ethereum',
};

function AppSkSource({ source, migrated }) {
  const { t } = useLocaleContext();

  if (!source) return null;

  if (source.startsWith('managed')) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography>{source}</Typography>
        <Tooltip title={migrated ? t('blocklet.skSourceMigratedTip') : t('blocklet.skSourceManagedTip')}>
          <InfoOutlinedIcon sx={{ fontSize: 16, color: migrated ? 'text.secondary' : 'warning.main' }} />
        </Tooltip>
      </Box>
    );
  }

  return <Typography>{source}</Typography>;
}

AppSkSource.propTypes = {
  source: PropTypes.string.isRequired,
  migrated: PropTypes.bool.isRequired,
};

const useRunningBlocklets = (blocklets) => {
  const { t } = useLocaleContext();

  let totalBlocklets = 0;
  let runningBlocklets = 0;
  if (blocklets) {
    totalBlocklets = blocklets.length;
    runningBlocklets = blocklets.filter((x) => isBlockletRunning(x)).length;
  }

  let blockletStats = totalBlocklets;
  if (runningBlocklets) {
    blockletStats += `<small>${t('common.running')} ${runningBlocklets}</small>`;
  }

  return blockletStats;
};

const useCustomDomain = (domains, customDomains) => {
  const { t } = useLocaleContext();

  if (customDomains.length) {
    return (
      <Box component="small">
        {t('router.domainAlias.custom')} {customDomains.length}
      </Box>
    );
  }

  return (
    <Box
      component="small"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        color: customDomains.length ? 'text.primary' : 'warning.main',
      }}>
      {t('router.domainAlias.noCustom')}
      <Tooltip title={t('router.domainAlias.noCustomTip')}>
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
      </Tooltip>
    </Box>
  );
};

const renderIcon = (status, createdAt, t) => {
  const timeoutError = status === BACKUPS.STATUS.PROGRESS && dayjs().diff(createdAt, 'hours') >= BACKUPS.TIMEOUT_HOURS;
  const pending = status === BACKUPS.STATUS.PROGRESS && !timeoutError;
  const success = status === BACKUPS.STATUS.SUCCEEDED && !timeoutError;

  if (timeoutError) {
    return (
      <Tooltip title={t('storage.spaces.backup.timeout')}>
        <Box sx={{ width: 8, height: 8, borderRadius: '100%', bgcolor: 'error.main' }} />
      </Tooltip>
    );
  }
  if (pending) {
    return (
      <Tooltip title={t('storage.spaces.backup.pending')}>
        <Box sx={{ width: 8, height: 8, borderRadius: '100%', bgcolor: 'warning.main' }} />
      </Tooltip>
    );
  }
  if (success) {
    return (
      <Tooltip title={t('storage.spaces.backup.succeeded')}>
        <Box sx={{ width: 8, height: 8, borderRadius: '100%', bgcolor: 'success.main' }} />
      </Tooltip>
    );
  }

  return null;
};

const useDidSpaceBackup = (backupEndpoint, backup) => {
  const { t, locale } = useLocaleContext();
  const createdAt = backup?.createdAt;

  if (backupEndpoint && createdAt) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 0.5,
          color: dayjs(createdAt).add(1, 'day').isAfter(dayjs()) ? 'text.primary' : 'warning.main',
        }}>
        {format(createdAt, locale === 'tw' ? 'zh' : locale)}
        <Tooltip
          title={t('storage.spaces.backup.lastBackupTip', {
            time: format(createdAt, locale === 'tw' ? 'zh' : locale),
          })}>
          <InfoOutlinedIcon sx={{ fontSize: 16 }} />
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, color: 'warning.main', fontSize: 30 }}>
      {t('storage.spaces.backup.noBackup')}
      <Tooltip title={t('storage.spaces.backup.noBackupTip')}>
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
      </Tooltip>
    </Box>
  );
};
const commonIconStyle = { fontSize: 30, color: 'text.primary' };

export default function BlockletOverview() {
  const { t, locale } = useLocaleContext();
  const { info: nodeInfo, inService, api } = useNodeContext();
  const { teamDid } = useTeamContext();
  const [showAllDIDs, setShowAllDIDs] = useState(false);

  const { did, blocklet } = useBlockletContext();
  const extra = useAsyncRetry(() => api.getBlockletBaseInfo({ input: { teamDid } }));

  const { appDid, appPid, migratedFrom = [] } = blocklet;

  const chainType = blocklet.environments.find((x) => x.key === 'BLOCKLET_APP_CHAIN_TYPE')?.value;

  const formatNumber = (num) => {
    if (typeof num !== 'number' || Number.isNaN(num)) {
      return '0';
    }

    if (num >= 10000) {
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(num);
    }
    return new Intl.NumberFormat(locale).format(num);
  };

  const infoRows = [
    appDid ? { name: t('blocklet.appId'), value: <DidAddress did={appDid} showQrcode /> } : null,
    appPid && appDid !== appPid
      ? {
          name: (
            <Box>
              {t('blocklet.appPid')}
              <Tooltip title={t('blocklet.whyNeedAppPid')} style={{ cursor: 'help', fontSize: 16 }}>
                <HelpOutlineIcon sx={{ verticalAlign: 'middle', mt: '-2px', ml: '2px' }} />
              </Tooltip>
            </Box>
          ),
          value: <DidAddress did={appPid} showQrcode />,
        }
      : null,
    migratedFrom?.length > 1
      ? {
          name: t('blocklet.alsoKnownAs'),
          value: (
            <div>
              {(showAllDIDs ? migratedFrom.slice(1) : migratedFrom.slice(1, 2)).map((x) => (
                <DidAddress did={x.appDid} showQrcode />
              ))}
              {migratedFrom.length > 2 && (
                <Button
                  sx={{
                    pl: 0,
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  }}
                  endIcon={
                    showAllDIDs ? (
                      <Icon icon={KeyboardArrowUpRoundedIcon} />
                    ) : (
                      <Icon icon={KeyboardArrowDownRoundedIcon} />
                    )
                  }
                  onClick={() => setShowAllDIDs(!showAllDIDs)}>
                  {showAllDIDs ? t('common.collapseAll') : t('blocklet.router.showAllDIDs')}
                </Button>
              )}
            </div>
          ),
        }
      : null,
    isServerless(blocklet)
      ? {
          name: 'NFT',
          value: (
            <DidAddress
              external
              href={getExplorerLink(blocklet?.controller?.chainHost, blocklet?.controller?.nftId, 'asset')}
              did={blocklet?.controller?.nftId}
              showQrcode
            />
          ),
        }
      : null,
    {
      name: t('common.owner'),
      value: blocklet.settings?.owner ? <DidAddress did={blocklet.settings.owner.did} showQrcode /> : '-',
    },
    blocklet.vaults?.length
      ? {
          name: t('blocklet.config.vault.name'),
          value: (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, '& > span': { width: 'auto' } }}>
              <DidAddress did={blocklet.vaults[blocklet.vaults.length - 1].did} showQrcode />
              <VaultStatus vaults={blocklet.vaults} appPid={blocklet.appPid} />
            </Box>
          ),
        }
      : null,
    {
      name: t('blocklet.installedAt'),
      value: blocklet.installedAt ? <RelativeTime value={blocklet.installedAt} type="all" locale={locale} /> : '-',
    },
    {
      name: t('blocklet.config.walletType.name'),
      value: WalletType[chainType || 'arcblock'] || chainType,
    },
    blocklet.externalSkSource
      ? {
          name: t('blocklet.skSource'),
          value: <AppSkSource source={blocklet.externalSkSource} migrated={migratedFrom.length > 0} />,
        }
      : null,
  ].filter(Boolean);

  if (inService) {
    infoRows.push(
      { name: t('common.serverDid'), value: <DidAddress did={nodeInfo.did} showQrcode /> },
      { name: t('common.serverVersion'), value: <Tag>{nodeInfo.version}</Tag> }
    );
  }

  const renderRows = (rows) =>
    rows.map((row) => {
      return (
        <InfoRow
          style={{ display: 'flex', alignItems: 'flex-start' }}
          valueComponent="div"
          key={row.name}
          nameWidth={150}
          name={row.name}
          nameFormatter={() => row.name}>
          {row.value}
        </InfoRow>
      );
    });

  const blockletStats = useRunningBlocklets(blocklet.children);

  // Calculate uptime from startedAt (persisted in DB) instead of process uptime
  const startedAtTime = blocklet?.startedAt ? new Date(blocklet.startedAt).getTime() : 0;
  const uptimeMs = startedAtTime && isBlockletRunning(blocklet) ? Date.now() - startedAtTime : 0;
  const uptime = useUpTime(uptimeMs, (x) => {
    const options = { compact: true, verbose: true, locale: locale === 'tw' ? 'zh' : locale };
    return prettyMs(x, options);
  });

  const domains = useMemo(() => blocklet?.site?.domainAliases || [], [blocklet?.site?.domainAliases]);
  const customDomains = useMemo(() => domains.filter((domain) => isCustomDomain(domain.value)), [domains]);
  const customDomain = useCustomDomain(domains, customDomains);

  const passport = useMemo(() => extra?.value?.passport || {}, [extra?.value?.passport]);
  const user = useMemo(() => extra?.value?.user || {}, [extra?.value?.user]);

  const backupEndpoint = useMemo(() => getSpaceBackupEndpoint(blocklet?.environments), [blocklet?.environments]);
  const didSpaceBackup = useDidSpaceBackup(backupEndpoint, extra?.value?.backup);

  const getBlockletServiceUrl = (app, tab) => {
    return `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/${app}/${tab}`;
  };

  const getBlockletServerUrl = (newTab) => {
    const prefix = process.env.NODE_ENV === 'production' ? nodeInfo?.routing?.adminPath : '';
    return joinURL(prefix, `/blocklets/${did}/${newTab}`);
  };

  const metrics = [
    {
      name: t('common.blocklets'),
      value: blockletStats,
      icon: <Box component={Icon} icon={AccountTreeRoundedIcon} sx={commonIconStyle} />,
      url: inService ? getBlockletServiceUrl('overview', 'components') : getBlockletServerUrl('components'),
    },
    {
      loading: extra?.loading,
      name: t('common.members'),
      value: `${formatNumber(user?.users || 0)}<small>${t('common.active')} ${formatNumber(user?.approvedUsers)}</small>`,
      icon: <Box component={Icon} icon={GroupRoundedIcon} sx={commonIconStyle} />,
      url: inService ? getBlockletServiceUrl('did-connect', 'members') : getBlockletServerUrl('members'),
    },
    {
      loading: extra?.loading,
      name: t('team.member.passports'),
      value: `${formatNumber(passport?.passports || 0)}<small>${t('common.active')} ${formatNumber(passport?.activePassports)}</small>`,
      icon: <Box component={Icon} icon={BadgeRoundedIcon} sx={commonIconStyle} />,
      url: inService ? getBlockletServiceUrl('did-connect', 'passports') : getBlockletServerUrl('passports'),
    },
    {
      loading: extra?.loading,
      name: t('common.domains'),
      value: (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
          }}>
          {domains.length}
          {customDomain}
        </Box>
      ),
      icon: <Box component={Icon} icon={LanguageRoundedIcon} sx={commonIconStyle} />,
      url: inService ? getBlockletServiceUrl('website', 'domains') : getBlockletServerUrl('domains'),
    },
    {
      name: t('common.uptime'),
      value: uptimeMs ? (
        uptime
      ) : (
        <Box sx={{ fontSize: 28, color: 'text.secondary' }}>{`${t('common.waiting')}...`}</Box>
      ),
      icon: <Box component={Icon} icon={AccessTimeRoundedIcon} sx={commonIconStyle} />,
    },
    blocklet.createdAt && +new Date(blocklet.createdAt) !== +new Date(0)
      ? {
          name: t('common.created'),
          value: format(new Date(blocklet.createdAt).getTime(), locale === 'tw' ? 'zh' : locale),
          icon: <Box component={Icon} icon={AccessTimeRoundedIcon} sx={commonIconStyle} />,
        }
      : null,
    {
      loading: extra?.loading,
      name: (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 0.5,
          }}>
          {t('storage.spaces.backup.lastBackup')}
          {extra?.value?.backup &&
            backupEndpoint &&
            renderIcon(extra?.value?.backup?.status, extra?.value?.backup?.createdAt, t)}
        </Box>
      ),
      value: didSpaceBackup,
      icon: <Box component={Icon} icon={BackupRoundedIcon} sx={commonIconStyle} />,
      url: inService ? getBlockletServiceUrl('did-spaces', 'backups') : getBlockletServerUrl('didSpaces'),
    },
  ].filter(Boolean);

  return (
    <Div component="div">
      <Box className="section">
        <Typography className="section__header" color="textPrimary">
          {t('common.overview')}
        </Typography>
        <Grid
          className="page-metrics"
          container
          spacing={{
            xs: 1,
            md: 2,
          }}>
          {metrics.map(({ icon, ...x }) => (
            <Grid
              key={x.name}
              sx={{ small: { ml: 0.5 } }}
              size={{
                xl: 1.5,
                lg: 3,
                md: 4,
                sm: 12,
                xs: 12,
              }}>
              <Metric {...x} />
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box className="section">
        <Typography className="section__header" color="textPrimary">
          {t('common.basicInfo')}
        </Typography>

        <Box className="basicInfo">{renderRows(infoRows)}</Box>
      </Box>
    </Div>
  );
}

const Div = styled(Typography)`
  .section {
    display: flex;
    flex-direction: column;
    margin-bottom: 64px;

    .section__header {
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 24px;
    }
  }
`;
