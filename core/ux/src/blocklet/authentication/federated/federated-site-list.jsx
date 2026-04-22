/* eslint-disable react/no-unstable-nested-components */
import StarsIcon from '@mui/icons-material/Stars';
import PropTypes from 'prop-types';
import { Box, SvgIcon, Tooltip, IconButton } from '@mui/material';
import { Icon } from '@iconify/react';
import syncIcon from '@iconify-icons/material-symbols/sync-rounded';
import Datatable from '@arcblock/ux/lib/Datatable';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Address from '@arcblock/did-connect-react/lib/Address';
import { useContext, useRef } from 'react';
import { useCreation, useMemoizedFn, useReactive } from 'ahooks';
import Button from '@arcblock/ux/lib/Button';
import Toast from '@arcblock/ux/lib/Toast';
import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import { useConfirm } from '@arcblock/ux/lib/Dialog';
import { sleep } from '@arcblock/ux/lib/Util';

import { useBlockletContext } from '../../../contexts/blocklet';
import { useNodeContext } from '../../../contexts/node';

import FederatedDetailDialog from './federated-detail-dialog';
import FederatedInviteDialog from './federated-invite-dialog';

function FederatedSiteList({ mode = 'member' }) {
  const federatedInviteDialogRef = useRef(null);
  const federatedDetailDialogRef = useRef(null);
  const { t, locale } = useContext(LocaleContext);
  const {
    blocklet,
    actions: { refreshBlocklet },
  } = useBlockletContext();
  const { confirmApi, confirmHolder } = useConfirm();
  const { api } = useNodeContext();
  const federatedSites = blocklet.settings.federated?.sites || [];
  const federatedConfig = blocklet.settings.federated?.config || {};
  const isMaster = federatedConfig.isMaster !== false;
  const currentSite = federatedSites.find((x) => x.appPid === blocklet.appPid);
  const currentState = useReactive({
    loadingSync: false,
  });

  const viewDetail = useMemoizedFn((row) => {
    federatedDetailDialogRef.current?.open(row);
  });
  const approveSite = useMemoizedFn((row) => {
    federatedDetailDialogRef.current?.approve(row, refreshBlocklet);
  });
  const toRemoveSite = useMemoizedFn((row) => {
    confirmApi.open({
      title: t('federated.removeFederatedLogin'),
      content: t('federated.removeFederatedLoginDescription'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonProps: {
        color: 'error',
      },
      async onConfirm(close) {
        await api.quitFederatedLogin({
          input: {
            did: blocklet.appPid,
            targetDid: row.appPid,
          },
        });
        close();
      },
    });
  });
  const toRevokeSite = useMemoizedFn((row) => {
    confirmApi.open({
      title: t('federated.disableFederatedLogin'),
      content: t('federated.disableFederatedLoginDescription'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonProps: {
        color: 'error',
      },
      async onConfirm(close) {
        await api.auditFederatedLogin({
          input: {
            memberPid: row.appPid,
            did: blocklet.appPid,
            status: 'revoked',
          },
        });
        close();
      },
    });
  });
  const toApproveSite = useMemoizedFn((row) => {
    confirmApi.open({
      title: t('federated.enableFederatedLogin'),
      content: t('federated.enableFederatedLoginDescription'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      async onConfirm(close) {
        await api.auditFederatedLogin({
          input: {
            memberPid: row.appPid,
            did: blocklet.appPid,
            status: 'approved',
          },
        });
        close();
      },
    });
  });

  const columns = useCreation(() => {
    const list = [
      {
        label: t('common.name'),
        name: 'appName',
        options: {
          customBodyRenderLite: (rowIndex) => {
            const row = federatedSites[rowIndex];
            const isSelfMaster = row.isMaster !== false;
            return (
              <Box
                sx={{
                  display: 'inline-block',
                }}>
                <Box
                  component="a"
                  href={row.appUrl}
                  target="_blank"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                  {isSelfMaster && <SvgIcon component={StarsIcon} style={{ marginRight: '4px' }} />}
                  {row.appName}
                </Box>
              </Box>
            );
          },
        },
      },
      {
        label: t('common.did'),
        name: 'appId',
        options: {
          customBodyRenderLite: (rowIndex) => {
            const row = federatedSites[rowIndex];
            return <Address>{row.appId}</Address>;
          },
        },
      },
      {
        label: t('common.status'),
        name: 'status',
        options: {
          customBodyRenderLite: (rowIndex) => {
            const row = federatedSites[rowIndex];
            const isSelfMaster = row.isMaster !== false;
            return <Box>{isSelfMaster ? '-' : t(`federated.status.${row.status}`)}</Box>;
          },
        },
      },
    ];
    if (isMaster) {
      list.push({
        label: t('common.actions'),
        name: 'actions',
        options: {
          customBodyRenderLite: (rowIndex) => {
            const row = federatedSites[rowIndex];
            const isSelfMaster = row.isMaster !== false;

            return (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                }}>
                {!isSelfMaster ? (
                  <>
                    <Button
                      key="quiteSite"
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toRemoveSite(row);
                      }}>
                      {t('federated.quitMember')}
                    </Button>
                    {row.status === 'pending' && (
                      <Button
                        key="auditSite"
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          approveSite(row);
                        }}>
                        {t('federated.status.pending')}
                      </Button>
                    )}
                    {row.status === 'approved' && (
                      <Button
                        key="revokeSite"
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toRevokeSite(row);
                        }}
                        style={{ whiteSpace: 'nowrap' }}>
                        {t('federated.revoke')}
                      </Button>
                    )}
                    {row.status === 'revoked' && (
                      <Button
                        key="approveSite"
                        variant="contained"
                        color="warning"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toApproveSite(row);
                        }}
                        style={{ whiteSpace: 'nowrap' }}>
                        {t('federated.approve')}
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {row.status === 'rejected' && (
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}>
                        {t('federated.status.rejected')}
                      </Button>
                    )}
                    {row.status === 'revoked' && (
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}>
                        {t('federated.status.revoked')}
                      </Button>
                    )}
                  </>
                )}
              </Box>
            );
          },
        },
      });
    }
    return list;
  }, [federatedConfig.appId, federatedSites, isMaster, t]);

  const tableOptions = useCreation(() => {
    return {
      sort: true,
      download: false,
      filter: false,
      print: false,
      expandableRowsOnClick: true,
      onRowClick(e, { dataIndex }) {
        const x = federatedSites[dataIndex];
        viewDetail(x);
      },
    };
  }, []);

  const showInvite = useMemoizedFn(() => {
    const customUrl = blocklet.environments.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL);
    if (customUrl?.value) {
      federatedInviteDialogRef.current?.open({
        link: customUrl.value,
      });
    } else {
      Toast.error(t('federated.failedToGetFederatedLoginLink'));
    }
  }, [blocklet.site?.domainAliases?.[0]?.href]);

  const quitFederatedLogin = useMemoizedFn(() => {
    confirmApi.open({
      title: t('federated.quitFederatedLogin'),
      content: t('federated.quitFederatedLoginDescription'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonProps: {
        color: 'error',
      },
      async onConfirm(close) {
        await api.quitFederatedLogin({
          input: {
            did: blocklet.appPid,
          },
        });
        close();
      },
    });
  });
  const disbandFederatedLogin = useMemoizedFn(() => {
    confirmApi.open({
      title: t('federated.disbandFederatedLogin'),
      content: t('federated.disbandFederatedLoginDescription'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonProps: {
        color: 'error',
      },
      async onConfirm(close) {
        await api.disbandFederatedLogin({
          input: {
            did: blocklet.appPid,
          },
        });
        close();
      },
    });
  });

  const handleSyncConfig = useMemoizedFn(async () => {
    try {
      currentState.loadingSync = true;
      await Promise.all([
        await api.syncFederatedConfig({
          input: {
            did: blocklet.appPid,
          },
        }),
        sleep(500),
      ]);
      Toast.success(t('common.succeeded'));
    } finally {
      currentState.loadingSync = false;
    }
  });

  const customButtons = [];
  if (currentSite.status !== 'pending') {
    customButtons.push(
      <Tooltip title={t('federated.syncConfig')}>
        <IconButton
          key="syncConfig"
          size="small"
          onClick={handleSyncConfig}
          disabled={currentState.loadingSync}
          sx={[
            {
              '@keyframes spin': {
                from: {
                  transform: 'rotate(0deg)',
                },
                to: {
                  transform: 'rotate(360deg)',
                },
              },
            },
            currentState.loadingSync ? { animation: 'spin 1s linear infinite' } : {},
          ]}>
          <Icon
            icon={syncIcon}
            style={{
              fontSize: 24,
            }}
          />
        </IconButton>
      </Tooltip>
    );
  }
  if (mode === 'master') {
    customButtons.push(
      <Button key="inviteJoinFederatedLogin" size="small" variant="contained" onClick={showInvite} sx={{ ml: 1 }}>
        {t('federated.inviteJoinFederatedLogin')}
      </Button>
    );
    customButtons.push(
      <Button
        key="disbandFederatedLogin"
        color="error"
        size="small"
        variant="contained"
        onClick={disbandFederatedLogin}
        sx={{ ml: 1 }}>
        {t('federated.disbandFederatedLogin')}
      </Button>
    );
  } else {
    customButtons.push(
      <Button
        key="quitFederatedLogin"
        size="small"
        variant="contained"
        color="error"
        onClick={quitFederatedLogin}
        sx={{ ml: 1 }}>
        {t('federated.quitFederatedLogin')}
      </Button>
    );
  }

  return (
    <>
      <Datatable
        className="main-table"
        locale={locale}
        data={federatedSites}
        columns={columns}
        customButtons={customButtons}
        title={<Box className="table-toolbar-left">{t('authentication.federated')}</Box>}
        options={tableOptions}
      />
      {confirmHolder}
      <FederatedInviteDialog ref={federatedInviteDialogRef} />
      <FederatedDetailDialog ref={federatedDetailDialogRef} />
    </>
  );
}

FederatedSiteList.propTypes = {
  mode: PropTypes.oneOf(['member', 'master']),
};

export default FederatedSiteList;
