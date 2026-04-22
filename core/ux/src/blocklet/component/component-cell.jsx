import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useContext, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import Badge from '@mui/material/Badge';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LaunchIcon from '@mui/icons-material/Launch';
import RestartIcon from '@mui/icons-material/Replay';
import StopIcon from '@mui/icons-material/Stop';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { Icon } from '@iconify/react';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import {
  getComponentMissingConfigs,
  getDisplayName,
  isInProgress,
  hasStartEngine,
  isBlockletRunning,
} from '@blocklet/meta/lib/util';
import BrandDocker from '@iconify-icons/tabler/brand-docker';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { useMemoizedFn } from 'ahooks';
import { joinURL, withQuery } from 'ufo';
import { useNavigate } from 'react-router-dom';

import { hasMountPoint } from '@blocklet/meta/lib/engine';
import { WELLKNOWN_BLOCKLET_ADMIN_PATH } from '@abtnode/constant';
import { useDeletingBlockletContext } from '../../contexts/deleting-blocklets';
import ComponentConfiguration from './configuration';
import BlockletPreferences from './blocklet-preference';
import BlockletStatus, { map as statusMap } from '../status';
import Confirm from '../../confirm';

import BlockletBundleAvatar from '../bundle-avatar';
import BlockletMode from '../mode';
import DeleteComponent from './delete';
import StartComponent from './start';
import Line from './line';
import Actions from '../../actions';
import ComponentInfoDialog from './component-info-dialog';
import ComponentCellMountPoint from './component-cell-mount-poin';
import { useNodeContext } from '../../contexts/node';

const isResource = (component) => !component?.meta?.group;

const getComponentName = (componentId, app) => {
  const ids = componentId.split('/').slice(1);
  let parent = app;
  let index = 0;
  const names = [];
  while (parent && index < ids.length) {
    // eslint-disable-next-line no-loop-func
    const component = parent.children.find((x) => x.meta.did === ids[index]);
    parent = component;
    index++;
    if (component) {
      names.push(component.meta.title);
    }
  }
  return names.join(' / ');
};

const getStatuses = (blueStatus, greenStatus) => {
  if (window.IS_DEBUG) {
    // eslint-disable-next-line no-console
    console.log('blocklet status', 'blueStatus:', blueStatus, 'greenStatus:', greenStatus);
  }
  const isRunning = blueStatus === 'running' || greenStatus === 'running';
  const isStopping = blueStatus === 'stopping' || greenStatus === 'stopping';
  const isBothDownloading = blueStatus === 'downloading' && greenStatus === 'downloading';

  let primaryStatus = '';
  let secondaryStatus = '';
  if (isStopping) {
    primaryStatus = 'stopping';
    secondaryStatus = '';
  } else if (isRunning) {
    primaryStatus = 'running';
  } else {
    primaryStatus = blueStatus || greenStatus || '';
  }

  if (isRunning) {
    if (blueStatus !== greenStatus) {
      secondaryStatus = blueStatus === 'running' ? greenStatus : blueStatus;
    }
  }

  if (isBothDownloading) {
    primaryStatus = 'running';
    secondaryStatus = 'downloading';
  }

  if (primaryStatus === 'running' && secondaryStatus === 'stopped') {
    secondaryStatus = '';
  }

  if (blueStatus === greenStatus) {
    primaryStatus = blueStatus;
    secondaryStatus = '';
  }

  return { primaryStatus, secondaryStatus };
};

export default function ComponentCell({
  blocklet,
  ancestors = [],
  depth = 0,
  onRemove = () => {},
  onStart = () => {},
  onStop = () => {},
  onRestart = () => {},
  getComponentUrl = () => window.location.origin,
  app = null,
}) {
  const { t, locale } = useContext(LocaleContext);
  const navigate = useNavigate();
  const [componentInfo, setComponentInfo] = useState();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);
  const { info: nodeInfo, inService } = useNodeContext();
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const { deletingBlocklets: deletingComponents } = useDeletingBlockletContext();

  let { status } = blocklet;
  if (depth === 1 && deletingComponents.includes(blocklet.meta.did)) {
    status = 'deleting';
  }

  const mountPoint = `/${blocklet.mountPoint || '/'}`.replace(/\/+/g, '/');

  const href = getComponentUrl(mountPoint);

  const appInProgress = isInProgress(app.status);
  const componentInProgress = isInProgress(blocklet.status);
  let deleteDisabledTip = '';
  if (appInProgress || componentInProgress || (depth === 1 && deletingComponents.includes(blocklet.meta.did))) {
    deleteDisabledTip = t('blocklet.component.tip.stopBlocklet');
  } else if (blocklet.dependents?.length) {
    const requires = blocklet.dependents.filter((x) => x.required);
    if (requires.length) {
      const names = requires.map((x) => getComponentName(x.id, app));
      deleteDisabledTip = t('blocklet.component.tip.requiredBy', { name: names.join(', ') });
    }
  }

  const navigateToLogs = useMemoizedFn(() => {
    const component = blocklet.meta.did;
    if (inService) {
      const url = withQuery(joinURL(WELLKNOWN_BLOCKLET_ADMIN_PATH, '/developers/logs'), {
        locale,
        component,
      });
      window.location.href = url;
    } else {
      const url = withQuery(joinURL('/blocklets', app.appPid, '/logs'), {
        locale,
        component,
      });
      navigate(url);
    }
  });

  const handleRemove = async (...param) => {
    setLoading(true);
    try {
      await onRemove(...param);
    } catch {
      // ignore
    }
    setLoading(false);
    setShowDeleteConfirm(false);
  };

  const { usingDocker, usingIsolation } = useMemo(() => {
    if (!blocklet.meta.group || blocklet.meta.group === 'static') {
      return { usingDocker: false, usingIsolation: false };
    }
    const enableDocker = !!nodeInfo?.enableDocker || window.blocklet?.enableDocker;
    const skipDocker = ([...app.configs, ...blocklet.configs] || []).find((x) => x.key === 'SKIP_DOCKER' && x.value);
    const useDocker = ([...app.configs, ...blocklet.configs] || []).find((x) => x.key === 'USE_DOCKER' && x.value);
    const skipDockerNetwork = ([...app.configs, ...blocklet.configs] || []).find(
      (x) => x.key === 'SKIP_DOCKER_NETWORK' && x.value
    );
    return {
      usingDocker: enableDocker ? !skipDocker : !!useDocker,
      usingIsolation:
        enableDocker && !skipDockerNetwork && (nodeInfo?.enableDockerNetwork || window.blocklet?.enableDockerNetwork),
    };
  }, [blocklet.configs, nodeInfo?.enableDocker, nodeInfo?.enableDockerNetwork, app.configs, blocklet.meta.group]);

  const { primaryStatus, secondaryStatus } = getStatuses(status, blocklet.greenStatus);

  return (
    <>
      <StyledComponentRow
        display="flex"
        key="group-not-gateway-box"
        py={2}
        className="component-item"
        justifyContent="flex-start"
        alignItems="center">
        <Box
          key={blocklet}
          sx={{
            pl: 2,
            width: { xs: 250, sm: 400 },
            display: 'flex',
            alignItems: 'center',
          }}>
          <BlockletBundleAvatar blocklet={blocklet} ancestors={ancestors} />
          <Box
            sx={{
              ml: '16px',
              minWidth: 0,
            }}>
            <Box className="component-header" onClick={() => setComponentInfo(blocklet)}>
              <Box className="component-name">{getDisplayName(blocklet, true)}</Box>
              <Box className="component-version">{blocklet?.meta?.version}</Box>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}>
              {primaryStatus && (
                <BlockletStatus
                  style={{ whiteSpace: 'nowrap' }}
                  status={primaryStatus}
                  source={blocklet.source}
                  progress={blocklet.progress}
                />
              )}
              {secondaryStatus &&
                (primaryStatus === 'running' && statusMap[secondaryStatus] === 'error' ? (
                  <Tooltip title={t('blocklet.status.failWithOldVersion')}>
                    <Box
                      sx={{
                        display: 'flex',
                        color: 'warning.main',
                        ml: 1,
                      }}>
                      <ErrorOutline />
                    </Box>
                  </Tooltip>
                ) : (
                  <BlockletStatus
                    style={{ whiteSpace: 'nowrap' }}
                    status={secondaryStatus}
                    source={blocklet.source}
                    progress={blocklet.progress}
                  />
                ))}
              <BlockletMode style={{ whiteSpace: 'nowrap' }} mode={blocklet.mode || ''} />
              {blocklet.mode !== 'development' && usingDocker && (
                <Tooltip title={t('blocklet.usingDocker')}>
                  <Box
                    sx={{
                      display: 'flex',
                      color: 'primary.main',
                      ml: 1,
                    }}>
                    <Icon icon={BrandDocker} />
                  </Box>
                </Tooltip>
              )}
              {blocklet.mode !== 'development' && usingIsolation && (
                <Tooltip title={t('blocklet.usingIsolation')}>
                  <Box
                    sx={{
                      display: 'flex',
                      color: 'primary.main',
                      ml: 1,
                    }}>
                    <Icon icon="streamline:network" />
                  </Box>
                </Tooltip>
              )}
              {!!blocklet.dependents?.length && (
                <Tooltip
                  title={[
                    `${t('common.dependents')}: `,
                    blocklet.dependents.map((x) => (
                      <Box
                        key={x.id}
                        sx={{
                          pl: 1,
                        }}>{`${getComponentName(x.id, app)} ${x.required ? `(${t('common.required')})` : ''}`}</Box>
                    )),
                  ]}>
                  <Box
                    sx={{
                      display: 'flex',
                      color: 'primary.main',
                      ml: 1,
                    }}>
                    <Icon icon="octicon:package-dependents-16" />
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
        {hasMountPoint(blocklet.meta) && (
          <ComponentCellMountPoint
            key={mountPoint}
            blocklet={blocklet}
            ancestors={ancestors}
            mountPoint={mountPoint}
            href={href}
          />
        )}
        <div style={{ flex: 1 }} />
        <Box
          key="actions"
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}>
          {hasStartEngine(blocklet.meta) && (
            <Tooltip title={t('common.visit')}>
              <Box
                component="a"
                sx={{ display: { xs: 'flex', md: 'none' } }}
                target="_blank"
                href={href}
                rel="noopener noreferrer">
                <IconButton size="small">
                  <LaunchIcon fontSize="small" />
                </IconButton>
              </Box>
            </Tooltip>
          )}
          <StartComponent
            blocklet={app}
            component={blocklet}
            onStart={onStart}
            onStop={onStop}
            disabled={!['starting', 'stopping'].includes(app.status) && isInProgress(app.status)}
          />
          <IconButton
            size="small"
            onClick={() => setShowPreferences(true)}
            disabled={appInProgress || componentInProgress}>
            <TuneOutlinedIcon fontSize="small" />
          </IconButton>
          <StyledBadge
            color="error"
            badgeContent=""
            variant="dot"
            invisible={!getComponentMissingConfigs(blocklet, ancestors[0]).length}>
            <Actions
              data-cy="component-actions"
              actions={[
                hasStartEngine(blocklet.meta) || isResource(blocklet)
                  ? {
                      icon: <InfoOutlinedIcon />,
                      text: t('common.detail'),
                      onClick: () => {
                        setComponentInfo(blocklet);
                      },
                    }
                  : null,
                {
                  icon: <RestartIcon />,
                  text: t('common.restart'),
                  onClick: () => {
                    setConfirmSetting({
                      title: `${t('common.restart')} ${blocklet.meta.title}`,
                      description: t('blocklet.action.restartDescription'),
                      confirm: t('blocklet.action.confirmRestart'),
                      cancel: t('common.cancel'),
                      onConfirm: async () => {
                        setLoading(true);
                        await onRestart(blocklet);
                        setLoading(false);
                        setConfirmSetting(null);
                      },
                      onCancel: () => setConfirmSetting(null),
                    });
                  },
                  disabled: loading || appInProgress || componentInProgress || !isBlockletRunning(blocklet),
                },
                primaryStatus === 'error'
                  ? {
                      icon: <StopIcon />,
                      text: t('common.stop'),
                      onClick: () => {
                        setConfirmSetting({
                          title: `${t('common.stop')} ${blocklet.meta.title}`,
                          description: t('blocklet.action.stopDescription'),
                          confirm: t('blocklet.action.confirmStop'),
                          cancel: t('common.cancel'),
                          onConfirm: async () => {
                            setLoading(true);
                            await onStop(blocklet);
                            setLoading(false);
                            setConfirmSetting(null);
                          },
                          onCancel: () => setConfirmSetting(null),
                        });
                      },
                      disabled: loading || appInProgress || componentInProgress,
                    }
                  : null,
                {
                  icon: <DeleteIcon />,
                  text: t('common.delete'),
                  onClick: () => {
                    setShowDeleteConfirm(true);
                  },
                  disabled: appInProgress || componentInProgress || !!deleteDisabledTip,
                  tip: deleteDisabledTip,
                },
                {
                  separator: true,
                },
                {
                  icon: <Icon icon="mdi:variable" />,
                  onClick: () => {
                    setShowEnvironment(true);
                  },
                  text: (
                    <StyledBadge
                      color="error"
                      badgeContent=""
                      variant="dot"
                      invisible={!getComponentMissingConfigs(blocklet, ancestors[0]).length}>
                      <Box sx={{ width: '100%' }}>{t('common.environments')}</Box>
                    </StyledBadge>
                  ),
                  disabled: appInProgress || componentInProgress,
                },
                {
                  icon: <Icon icon="heroicons:command-line" />,
                  text: t('common.logs'),
                  onClick: navigateToLogs,
                  disabled: appInProgress || componentInProgress || !!deleteDisabledTip,
                  tip: deleteDisabledTip,
                },
              ].filter(Boolean)}
            />
          </StyledBadge>
        </Box>
      </StyledComponentRow>
      <Line key="line" />
      <ComponentInfoDialog
        componentInfo={componentInfo}
        onClose={setComponentInfo}
        blocklet={blocklet}
        app={app}
        depth={depth}
      />
      <DeleteComponent
        blocklet={app}
        component={blocklet}
        remove={handleRemove}
        onCancel={() => setShowDeleteConfirm(false)}
        hideBtn
        showConfirm={showDeleteConfirm}
        key="delete-component"
      />
      {confirmSetting && (
        <Confirm
          title={confirmSetting.title}
          description={confirmSetting.description}
          confirm={confirmSetting.confirm}
          cancel={confirmSetting.cancel}
          params={confirmSetting.params}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
          key="confirm-setting"
        />
      )}
      {showEnvironment && (
        <ComponentConfiguration
          open
          hiddenChildren
          onClose={() => setShowEnvironment(false)}
          blocklet={blocklet}
          ancestors={ancestors}
        />
      )}
      {showPreferences && (
        <BlockletPreferences open onClose={() => setShowPreferences(false)} blocklet={blocklet} ancestors={ancestors} />
      )}
    </>
  );
}

ComponentCell.propTypes = {
  blocklet: PropTypes.object.isRequired,
  ancestors: PropTypes.array,
  depth: PropTypes.number,
  onRemove: PropTypes.func,
  onStart: PropTypes.func,
  onStop: PropTypes.func,
  onRestart: PropTypes.func,
  getComponentUrl: PropTypes.func,
  app: PropTypes.object,
};

export const StyledBadge = styled(Badge)`
  .BaseBadge-badge {
    top: ${(props) => props.top * 8 || 6}px;
    right: ${(props) => props.right * 8 || 6}px;
  }
`;

export const StyledComponentRow = styled(Box)`
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  .component-header {
    display: flex;
    align-items: center;
    align-items: flex-end;
    cursor: pointer;
  }
  .component-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 16px;
  }
  .component-version {
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    margin-left: 4px;
    transform: translateY(-1px);
  }
`;
