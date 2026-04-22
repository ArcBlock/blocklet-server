/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable operator-linebreak */
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import React, { useContext, useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import { LAUNCH_SESSION_STATUS, WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Alert from '@mui/material/Alert';
import ButtonGroup from '@mui/material/ButtonGroup';
import Spinner from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import isUrl from 'is-url';
import { formatError } from '@blocklet/error';

import Button from '@arcblock/ux/lib/Button';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import {
  getAppMissingConfigs,
  getDisplayName,
  hasRunnableComponent,
  isDeletableBlocklet,
  isInProgress,
  isBlockletRunning,
} from '@blocklet/meta/lib/util';
import { BLOCKLET_CONTROLLER_STATUS, BLOCKLET_MODES } from '@blocklet/constant';
import Toast from '@arcblock/ux/lib/Toast';

import Confirm from '../confirm';
import { useNodeContext } from '../contexts/node';
import { isDownloading, sleep } from '../util';
import Icons from './icons';
import { getServerUrl } from './util';
import joinUrlKeepSearch from '../util/join-url-keep-search';
import getSafeUrlWithToast from '../util/get-safe-url';

const INTERNAL = 'internal';
const EXTERNAL = 'external';

function BlockletActions({
  blocklet,
  onStart,
  onComplete,
  variant = 'menu',
  source = 'blocklet-list',
  hasPermission = false,
  getComponentUrl = null,
  useBlockletUrlEvaluation = () => ({ loading: false, recommendedUrl: window?.location?.href }),
  ...rest
}) {
  const node = useNodeContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);
  const { t } = useContext(LocaleContext);
  const [skipSetup] = useLocalStorage('skip-blocklet-setup', false);
  const { loading: recommendedUrlLoading, recommendedUrl } = useBlockletUrlEvaluation(blocklet);
  const [tab] = useLocalStorage('blocklet-type-filter', INTERNAL);
  const inProgress = isInProgress(blocklet.status);

  const [disableStart, setDisableStart] = useState(false);
  useEffect(() => {
    if (!blocklet?.controller) {
      return;
    }

    setDisableStart(blocklet?.controller?.status?.value === BLOCKLET_CONTROLLER_STATUS.suspended);

    const func = async () => {
      try {
        const data = await node.api.getLauncherSession({
          input: {
            launcherSessionId: blocklet?.controller?.launcherSessionId,
            launcherUrl: blocklet?.controller?.launcherUrl,
          },
        });

        if (data?.error) {
          console.error('get launcher session failed', data.error);
          return;
        }

        setDisableStart(
          [LAUNCH_SESSION_STATUS.overdue, LAUNCH_SESSION_STATUS.canceled, LAUNCH_SESSION_STATUS.terminated].includes(
            data?.launcherSession?.status
          )
        );
      } catch (error) {
        console.error('call getLauncherSession error', error);
      }
    };

    func();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { inService } = node;
  const isDetail = source === 'blocklet-detail';

  const createHandler =
    (action, fn, requireUserConfirm = false) =>
    async () => {
      const onConfirm = async (params) => {
        onStart({ action, blocklet });
        setLoading(true);
        setCurrentAction(action);
        let isRemoved = false;
        try {
          if (action === 'remove') {
            await fn(params);
          } else if (action === 'start') {
            if (!hasRunnableComponent(blocklet)) {
              Toast.error(t('blocklet.noComponent'));
              return;
            }

            if (
              !inService &&
              !skipSetup &&
              !blocklet.settings?.initialized &&
              blocklet.mode !== BLOCKLET_MODES.DEVELOPMENT
            ) {
              if (!recommendedUrl || !isUrl(recommendedUrl)) {
                Toast.error(t('blocklet.gotoVisitError'));
                return;
              }
              // 跳转到 setup 流程界面时携带 serverUrl 查询参数
              const serverUrl = getServerUrl(node.info);
              const url = new URL(recommendedUrl);
              url.searchParams.set('serverUrl', serverUrl);
              // 可能为外部 url，有白名单限制，可以信任
              window.open(getSafeUrlWithToast(url.href, { allowDomains: null }));
              onComplete({ action, blocklet });
              return;
            }

            const componentDids = blocklet.children
              .filter(
                (x) =>
                  !isInProgress(x.status) &&
                  x.status !== 'running' &&
                  !isInProgress(x.greenStatus) &&
                  x.greenStatus !== 'running'
              )
              .map((x) => x.meta.did);

            const input = { did: blocklet.meta.did, componentDids };
            await fn({ input });
          } else if (['stop', 'restart', 'reload'].includes(action)) {
            const componentDids = blocklet.children.filter((x) => isBlockletRunning(x)).map((x) => x.meta.did);

            const input = { did: blocklet.meta.did, componentDids };

            await fn({ input });
          } else {
            const input = { did: blocklet.meta.did };
            await fn({ input });
          }

          if (action === 'remove') {
            isRemoved = true; // Deleted send request and succeeded
          } else {
            await sleep(1000); // just avoid user feeling so fast
          }

          if (action === 'reload') {
            Toast.success(t('blocklet.reloadSuccess'));
          }

          setConfirmSetting(null);
          onComplete({ action, blocklet });
        } catch (err) {
          const errMsg = `Blocklet ${action} failed: ${formatError(err)}`;
          onComplete({ action, blocklet, error: new Error(errMsg) });
          throw new Error(errMsg);
        } finally {
          if (!isRemoved) {
            setLoading(false);
          }
        }
      };

      const onCancel = () => {
        setLoading(false);
        setConfirmSetting(null);
      };

      const name = getDisplayName(blocklet, true);

      const removeSetting =
        blocklet.mode === BLOCKLET_MODES.DEVELOPMENT
          ? {
              description: () => (
                <Typography component="div">
                  <Typography gutterBottom>{t('blocklet.action.removeApplicationDescription')}</Typography>
                </Typography>
              ),
              params: { removeType: 'complete' },
            }
          : {
              description: (params, setParams) => (
                <Typography component="div">
                  <Typography gutterBottom>{t('blocklet.action.removeApplicationDescription')}</Typography>
                  <RadioGroup
                    name="removeType"
                    value={params.removeType}
                    onChange={(e) => setParams({ ...params, removeType: e.target.value })}>
                    <FormControlLabel
                      value="backup"
                      control={<Radio />}
                      label={t('blocklet.action.removeApplicationAfterBackup')}
                    />
                    <FormControlLabel
                      value="complete"
                      control={<Radio />}
                      label={t('blocklet.action.removeApplicationComplete')}
                    />
                  </RadioGroup>
                </Typography>
              ),
              params: { removeType: 'backup' },
            };

      const confirmSettings = {
        stop: {
          title: `${t('common.stop')} ${name}`,
          description: t('blocklet.action.stopDescription'),
          confirm: t('blocklet.action.confirmStop'),
          cancel: t('common.cancel'),
          onConfirm,
          onCancel,
        },
        restart: {
          title: `${t('common.restart')} ${name}`,
          description: t('blocklet.action.restartDescription'),
          confirm: t('blocklet.action.confirmRestart'),
          cancel: t('common.cancel'),
          onConfirm,
          onCancel,
        },
        remove: {
          title: `${t('common.remove')} ${name}`,
          confirm: t('blocklet.action.confirmRemove'),
          cancel: t('common.cancel'),
          onConfirm,
          onCancel,
          ...removeSetting,
        },
        cancelDownload: {
          title: `${t('common.cancel')}`,
          description: t('blocklet.action.cancelDownloadDescription', { name }),
          confirm: t('common.confirm'),
          cancel: t('common.cancel'),
          onConfirm,
          onCancel,
        },
      };

      if (requireUserConfirm) {
        setConfirmSetting(confirmSettings[action]);
      } else {
        await onConfirm();
      }
    };

  const open = Boolean(anchorEl);

  const onOpen = (e) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      // eslint-disable-next-line no-empty
    } catch {}
    setAnchorEl(e.currentTarget);
  };

  const onClose = (e) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      // eslint-disable-next-line no-empty
    } catch {}
    setAnchorEl(null);
  };

  const onAction = async (action, e) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      // eslint-disable-next-line no-empty
    } catch {}

    if (typeof action.handler === 'function') {
      try {
        setLoading(true);
        setCurrentAction(action.action);
        await action.handler();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Blocklet ${action.name} failed: `, err);
      } finally {
        setLoading(false);
        setAnchorEl(null);
      }
    } else {
      setAnchorEl(null);
    }
  };

  const removeAction =
    !inService && isDeletableBlocklet(blocklet)
      ? {
          action: 'remove',
          icon: Icons.Remove,
          name: t('common.remove'),
          handler: createHandler(
            'remove',
            async ({ removeType }) => {
              if (removeType === 'backup') {
                await node.api.backupBlocklet({ input: { appDid: blocklet.appDid, to: 'disk' } });
              }
              await node.api.deleteBlocklet({ input: { did: blocklet.meta.did, keepData: false } });
            },
            true
          ),
          disabled: inProgress,
        }
      : null;

  const cancelDownloadAction = {
    action: 'remove',
    icon: ({ sx, ...restProps }) => <Icons.Cancel sx={{ ...sx, paddingRight: '2px', zoom: 0.95 }} {...restProps} />,
    name: t('common.cancel'),
    handler: createHandler('cancelDownload', node.api.cancelDownloadBlocklet, true),
  };

  const missingRequiredConfigs = getAppMissingConfigs(blocklet);

  const handleOpenDashboard = (type = 'dashboard') => {
    const mountPoint = `/${blocklet.mountPoint || '/'}`.replace(/\/+/g, '/');
    const href = getComponentUrl?.({ mountPoint, blocklet });
    if (!href || !isUrl(href)) {
      Toast.error(t('blocklet.gotoVisitError'));
      return;
    }
    // 限定域名范围在 blocklet 配置的域名中（该代码可能运行在 webapp 下）
    const domainAliases = blocklet?.site?.domainAliases;
    if (type === 'logs') {
      window.open(
        getSafeUrlWithToast(joinUrlKeepSearch(href, `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/developers/logs`), {
          allowDomains: domainAliases?.map((x) => x.value),
        })
      );
    } else {
      window.open(
        getSafeUrlWithToast(joinUrlKeepSearch(href, `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin`), {
          allowDomains: domainAliases?.map((x) => x.value),
        })
      );
    }
  };

  let actions = [
    {
      action: 'start',
      icon: Icons.Start,
      inExternal: true,
      name: t('common.start'),
      handler: createHandler('start', node.api.startBlocklet),
      disabled:
        disableStart ||
        blocklet.children.every((x) => isBlockletRunning(x)) ||
        isDownloading(blocklet.status) ||
        recommendedUrlLoading ||
        inProgress,
    },
    {
      action: 'stop',
      icon: Icons.Stop,
      inExternal: true,
      name: t('common.stop'),
      handler: createHandler('stop', node.api.stopBlocklet, true),
      disabled: !['running', 'starting', 'error'].includes(blocklet.status),
    },
    {
      action: 'restart',
      inExternal: true,
      icon: Icons.Restart,
      name: t('common.restart'),
      handler: createHandler('restart', node.api.restartBlocklet, true),
      disabled: disableStart || blocklet.status !== 'running',
    },
    isDownloading(blocklet.status) ? cancelDownloadAction : removeAction,
    {
      separator: true,
    },
    !inService
      ? {
          action: 'dashboard',
          icon: ({ style, ...restProps }) => (
            <Icons.Dashboard {...restProps} style={{ ...style, width: '26px', height: '26px', paddingRight: '3px' }} />
          ),
          name: t('sidebar.dashboard'),
          handler: handleOpenDashboard,
        }
      : null,
    !inService && !isDetail
      ? {
          action: 'logs',
          icon: Icons.LogIcon,
          name: t('common.logs'),
          handler: () => handleOpenDashboard('logs'),
        }
      : null,
  ].filter(Boolean);

  if (tab === EXTERNAL) {
    // eslint-disable-next-line no-return-assign
    actions = actions.filter((x) => x.inExternal);
  }

  if (variant === 'menu') {
    return (
      <Div data-cy="blocklet-actions">
        <IconButton
          aria-label="more"
          aria-controls="actions-menu"
          aria-haspopup="true"
          data-cy="trigger-blocklet-actions"
          actions-blocklet-did={blocklet.meta.did}
          onClick={onOpen}
          size="small"
          disabled={!hasPermission || (!isDownloading(blocklet.status) && loading)}>
          <MoreVertIcon />
        </IconButton>

        <Menu id="actions-menu" anchorEl={anchorEl} keepMounted open={open} onClose={onClose} PaperProps={{}}>
          {missingRequiredConfigs.length > 0 && (
            <Alert style={{ maxWidth: '400px' }} severity="error">
              {t('blocklet.config.missingRequired')}
              <br />
              <Link to={`/blocklets/${blocklet.meta.did}/components`}>{t('blocklet.config.gotoFix')}</Link>
            </Alert>
          )}
          {actions.map((action, i) => {
            if (action.separator) {
              // eslint-disable-next-line react/no-array-index-key
              return <Divider key={`separator-${i}`} />;
            }
            return (
              <MenuItem
                dense
                key={action.name}
                onClick={(e) => onAction(action, e)}
                disabled={loading || action.disabled}
                data-cy={`${action.action}-blocklet`}>
                <ListItemIcon style={{ minWidth: 24 }}>
                  {currentAction === action.action && loading ? (
                    <Spinner size={16} sx={{ marginRight: 1 }} />
                  ) : (
                    <action.icon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText primary={action.name} />
              </MenuItem>
            );
          })}
        </Menu>
        {confirmSetting && (
          <Confirm
            title={confirmSetting.title}
            description={confirmSetting.description}
            confirm={confirmSetting.confirm}
            cancel={confirmSetting.cancel}
            params={confirmSetting.params}
            onConfirm={confirmSetting.onConfirm}
            onCancel={confirmSetting.onCancel}
          />
        )}
      </Div>
    );
  }

  return (
    <Div data-cy="blocklet-actions" {...rest}>
      <ButtonGroup>
        {actions
          .filter((x) => !x.separator && !x.onlyInMenu)
          .map((action) => (
            <Button
              title={action.name}
              key={action.name}
              data-cy={`${action.action}-blocklet`}
              onClick={() => onAction(action)}
              disabled={Boolean(action.disabled) || loading}>
              {currentAction === action.action && loading ? (
                <Spinner size={16} sx={{ marginRight: 1 }} />
              ) : (
                <action.icon />
              )}
              <span className="blocklet-action-text">{action.name}</span>
            </Button>
          ))}
      </ButtonGroup>
      {confirmSetting && (
        <Confirm
          title={confirmSetting.title}
          description={confirmSetting.description}
          confirm={confirmSetting.confirm}
          cancel={confirmSetting.cancel}
          params={confirmSetting.params}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
        />
      )}
    </Div>
  );
}

BlockletActions.propTypes = {
  getComponentUrl: PropTypes.func,
  blocklet: PropTypes.object.isRequired,
  onStart: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['menu', 'group']),
  source: PropTypes.oneOf(['blocklet-list', 'blocklet-detail']),
  hasPermission: PropTypes.bool,
  useBlockletUrlEvaluation: PropTypes.func,
};

const Div = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: ${(props) => props.theme.breakpoints.values.sm}px) {
    .MuiButton-root {
      padding: 4px;
      font-size: 10px;
    }
  }
`;

export default memo(BlockletActions);
