import React, { useState, useContext, useMemo } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import UpdateIcon from '@mui/icons-material/Update';
import { Icon } from '@iconify/react';
import Grid from '@mui/material/Grid';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { APP_STRUCT_VERSION } from '@abtnode/constant';
import Spinner from '@mui/material/CircularProgress';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import Empty from '@arcblock/ux/lib/Empty';
import { forEachChildSync, isInProgress } from '@blocklet/meta/lib/util';
import { formatError } from '@blocklet/error';
import Toast from '@arcblock/ux/lib/Toast';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';

import { useDeletingBlockletContext } from '../../contexts/deleting-blocklets';
import AutoCheckUpdate from '../auto-check-update';
import { useNodeContext } from '../../contexts/node';
import { sleep, BlockletAdminRoles } from '../../util';
import Permission from '../../permission';
import ComponentConfiguration from './configuration';
import AddComponentButton from './add-component/add-component-button';
import AddRule from '../router/action/add-rule';
import RuleList from '../router/rule-list';
import useCheckUpdateByUrl from '../../hooks/use-check-update-by-url';
import useGetInstallComponentByUrl from '../../hooks/use-install-component-by-url';
import ComponentCell, { StyledBadge, StyledComponentRow } from './component-cell';
import OptionalComponentCell from './optional-component-cell';
import AddComponentDialog from './add-component/add-component-dialog';
import Actions from '../../actions';
import BlockletPreferences from './blocklet-preference';

export default function BlockletComponent({
  blocklet,
  onUpdate = () => {},
  getComponentUrl = () => window.location.origin,
  ...rest
}) {
  const { t } = useContext(LocaleContext);
  const { api, inService, info } = useNodeContext();
  const { addDeletingDid, removeDeletingDid, matchDeletingDid } = useDeletingBlockletContext();
  const [loading, setLoading] = useState(false);
  const [updateConfirm, setUpdateConfirm] = useState(null);
  const [showSettings, setShowSettings] = useState(null);
  const [showContainer, setShowContainer] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [installComponentMeta, setInstallComponentMeta] = useState(null);
  const needMigration = blocklet && blocklet.structVersion !== APP_STRUCT_VERSION;

  // update dot is not used but maybe useful in the further
  const [showUpdateDot, setShowUpdateDot] = useState(false);

  const components = [...blocklet.children] || [];
  if (blocklet.meta.group !== 'gateway') {
    // add root blocklet to table list
    components.unshift(blocklet);
  }

  matchDeletingDid(components.map((e) => e.meta.did));

  const checkForUpdates = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      // check child component version
      const { updateId, updateList } =
        (await api.checkComponentsForUpdates({ input: { did: blocklet.meta.did } })).preUpdateInfo || {};

      setLoading(false);

      if (!updateId) {
        Toast.info(t('blocklet.component.noUpdate'));
        return;
      }

      const list = [];
      forEachChildSync(blocklet, (b, { id, ancestors }) => {
        const updateItem = updateList.find((x) => x.id === id);
        if (updateItem) {
          const name = ancestors
            .slice(1)
            .concat(b)
            .map((x) => x.meta.title || x.meta.name)
            .join(' / ');

          // groupId 为一级组件的 id
          const groupId = (ancestors[1] || b).meta.did;
          list.push({
            groupId,
            name,
            version: b.meta.version,
            newVersion: updateItem.meta.version,
          });
        }
      });

      const checks = {};

      list.forEach((x) => {
        if (!checks[x.groupId]) {
          checks[x.groupId] = true;
        } else {
          x.disabled = true;
        }
      });

      setUpdateConfirm({
        params: {
          updateId,
        },
        list,
        checks,
        hasChecks: true,
      });
    } catch (err) {
      setLoading(false);
      Toast.error(formatError(err));
    }
  };

  const onConfirmUpdate = async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      const selectedComponents = Object.keys(updateConfirm.checks).filter((x) => updateConfirm.checks[x]);
      const input = { updateId: updateConfirm.params.updateId, rootDid: blocklet.meta.did, selectedComponents };
      await api.upgradeComponents({ input });
      setLoading(false);
      setUpdateConfirm(null);
      setShowUpdateDot(null);
    } catch (error) {
      setLoading(false);
      Toast.error(formatError(error));
    }
  };

  const removeComponent = async (d, type) => {
    addDeletingDid(d.meta.did);
    try {
      await api.deleteComponent({
        input: { did: d.meta.did, keepData: type === 'keepData', rootDid: blocklet.meta.did },
      });
      await sleep(800);
    } catch (err) {
      Toast.error(formatError(err));

      removeDeletingDid(d.meta.did);
    }
  };

  const startComponent = async (d) => {
    try {
      await api.startBlocklet({
        input: { did: blocklet.meta.did, componentDids: [d.meta.did] },
      });
      await sleep(800);
    } catch (err) {
      Toast.error(formatError(err));
    }
  };

  const stopComponent = async (d) => {
    try {
      await api.stopBlocklet({
        input: { did: blocklet.meta.did, componentDids: [d.meta.did] },
      });
      await sleep(800);
    } catch (err) {
      Toast.error(formatError(err));
    }
  };

  const restartComponent = async (d) => {
    try {
      await api.restartBlocklet({
        input: { did: blocklet.meta.did, componentDids: [d.meta.did] },
      });
      await sleep(800);
    } catch (err) {
      Toast.error(formatError(err));
    }
  };

  const onUpdateChecksChange = (e, groupId) => {
    const { checked: newValue } = e.target;
    setUpdateConfirm((x) => {
      const checks = Object.entries(x.checks).reduce((o, [key, oldValue]) => {
        o[key] = groupId === key || groupId === 'all' ? newValue : oldValue;
        return o;
      }, {});
      const hasChecks = Object.values(checks).includes(true);
      return {
        ...x,
        checks,
        hasChecks,
      };
    });
  };

  // 是否全选
  const checkedAll = useMemo(() => {
    return updateConfirm?.list.filter((x) => !x.disabled).every((x) => updateConfirm.checks[x.groupId]);
  }, [updateConfirm]);

  useCheckUpdateByUrl(checkForUpdates);
  const _installComponentMeta = useGetInstallComponentByUrl({ blocklet, scrollToComponent: true });
  const parseInstallComponentMeta = installComponentMeta || _installComponentMeta;

  return (
    <Div component="div" {...rest} onUpdate={onUpdate}>
      <TitleRow display="flex">
        <TitleItem flexDirection="row" className="title" display="flex" alignItems="center">
          {components?.length ? `${t('common.components')} (${components.length})` : `${t('common.components')}`}
          {!needMigration && (
            <Permission permission={inService ? '' : 'mutate_blocklets'} role={inService ? BlockletAdminRoles : []}>
              <AutoCheckUpdate>
                <StyledBadge
                  top={1.2}
                  right={0.4}
                  color="error"
                  badgeContent=""
                  variant="dot"
                  invisible={!showUpdateDot}>
                  <Button
                    disabled={loading || isInProgress(blocklet.status)}
                    onClick={() => {
                      checkForUpdates();
                    }}
                    data-cy="check-for-updates">
                    <Box
                      sx={{
                        ml: 0.5,
                        mr: 0.5,
                        display: 'flex',
                      }}>
                      {loading ? <Spinner size={16} /> : <UpdateIcon style={{ fontSize: '1em' }} />}
                    </Box>
                    {t('blocklet.component.checkUpdateTitle')}
                  </Button>
                </StyledBadge>
              </AutoCheckUpdate>
            </Permission>
          )}
        </TitleItem>
        <Permission permission={inService ? '' : 'mutate_blocklets'} role={inService ? BlockletAdminRoles : []}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {!needMigration && (
              <AddComponentButton
                blocklet={blocklet}
                serverVersion={info.version}
                disabled={loading || isInProgress(blocklet.status)}
              />
            )}
            <Actions
              data-cy="component-actions"
              actions={[
                {
                  icon: <Icon icon="fluent:link-20-filled" />,
                  onClick: () => setShowAddRule(true),
                  text: t('router.rule.add.title'),
                  disabled: loading || isInProgress(blocklet.status),
                },
                ...(!needMigration
                  ? [
                      {
                        icon: <Icon icon="mdi:variable" />,
                        onClick: () => {
                          setShowEnvironment(true);
                        },
                        text: t('common.environments'),
                      },
                      {
                        icon: <TuneOutlinedIcon />,
                        onClick: () => {
                          setShowPreferences(true);
                        },
                        text: t('common.preferences'),
                      },
                    ]
                  : []),
              ].filter(Boolean)}
            />
          </Box>
        </Permission>
      </TitleRow>
      {components?.length ? (
        <>
          <Box
            key={`top-blocklet-${blocklet.meta.did}`}
            sx={{
              mt: 2,
            }}>
            {/* backward compatible */}
            {blocklet.meta.group !== 'gateway' && (
              <ComponentCell
                key={`0-${blocklet.meta.did}`}
                blocklet={blocklet}
                app={blocklet}
                onRemove={removeComponent}
                onStart={startComponent}
                onStop={stopComponent}
                onRestart={restartComponent}
                getComponentUrl={getComponentUrl}
              />
            )}
            {/* components */}
            {blocklet.children.map((component) => {
              return (
                <ComponentCell
                  key={`1-${component.meta.did}`}
                  depth={1}
                  blocklet={component}
                  ancestors={[blocklet]}
                  app={blocklet}
                  onRemove={removeComponent}
                  onStart={startComponent}
                  onStop={stopComponent}
                  onRestart={restartComponent}
                  getComponentUrl={getComponentUrl}
                />
              );
            })}
          </Box>
          {blocklet.optionalComponents?.map((component) => (
            <StyledComponentRow key={component.meta.did}>
              <OptionalComponentCell
                blocklet={component}
                ancestors={[blocklet]}
                setInstallComponentMeta={setInstallComponentMeta}
                {...component}
              />
            </StyledComponentRow>
          ))}
        </>
      ) : (
        <Box
          sx={{
            mt: 8,
          }}>
          <Empty>{t('blocklet.component.noComponent')}</Empty>
        </Box>
      )}
      {!!blocklet.site.rules.length && (
        <Box
          sx={{
            mt: 0,
            '.component-item__indent': {
              pl: 2,
              width: 0,
            },
          }}>
          <RuleList />
        </Box>
      )}
      {!!updateConfirm && (
        <Dialog open fullWidth>
          <Box
            sx={{
              paddingY: 1.5,
            }}>
            <DialogTitle>{t('blocklet.component.updateTitle')}</DialogTitle>
            <Box
              component={DialogContent}
              sx={{
                py: 4,
              }}>
              {updateConfirm.list.filter((x) => !x.disabled).length > 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                  <Checkbox checked={checkedAll} onChange={(e) => onUpdateChecksChange(e, 'all')} />
                  <Box>{checkedAll ? t('common.unselectAll') : t('common.selectAll')}</Box>
                </Box>
              )}
              {updateConfirm.list.map((x) => (
                <Box
                  key={x.name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1,
                  }}>
                  <Checkbox
                    checked={updateConfirm.checks[x.groupId]}
                    onChange={(e) => onUpdateChecksChange(e, x.groupId)}
                    style={{ marginLeft: x.disabled ? 16 : 0, alignSelf: 'flex-start' }}
                    defaultChecked
                    disabled={x.disabled}
                  />
                  <Box
                    key={`${x.name}-${x.newVersion}`}
                    sx={{
                      flexGrow: 1,
                    }}>
                    <Box
                      xs={8}
                      sx={{
                        pt: 1,
                      }}>
                      {x.name}
                    </Box>
                    {x.version && (
                      <Grid
                        container
                        spacing={2}
                        sx={{
                          fontSize: 'h6.fontSize',
                          alignItems: 'center',
                        }}>
                        <Grid size={3}>{x.version}</Grid>
                        <Grid size={1}>
                          <ArrowForwardIcon style={{ fontSize: '0.9em' }} />
                        </Grid>
                        <Grid size={3}>
                          <Box
                            sx={{
                              color: 'secondary.main',
                            }}>
                            {x.newVersion}
                          </Box>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
            <DialogActions style={{ padding: '8px 24px 24px' }}>
              <Button
                onClick={() => {
                  setUpdateConfirm(null);
                }}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirmUpdate();
                }}
                color="primary"
                disabled={loading || !updateConfirm.hasChecks}
                variant="contained"
                autoFocus>
                {loading && <Spinner size={16} />}
                {t('common.update')}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      )}
      {!!showSettings && (
        <Dialog open fullWidth onClose={() => setShowSettings(false)}>
          <Box
            sx={{
              paddingY: 1.5,
            }}>
            <DialogTitle>{t('common.configuration')}</DialogTitle>
            <DialogContent>
              <Box
                sx={{
                  py: 2,
                }}>
                <FormControlLabel
                  control={<Switch checked={showContainer} onChange={(e) => setShowContainer(!!e.target.checked)} />}
                  label={t('blocklet.component.showContainer')}
                />
              </Box>
            </DialogContent>
          </Box>
        </Dialog>
      )}
      {/* FIXME: 此处需要传入 storeUrl 字段 */}
      {/* 是否可以根据 bundleSource 字段来获得 storeUrl */}
      <AddComponentDialog
        selectedMeta={parseInstallComponentMeta}
        blocklet={blocklet}
        showDialog={!!parseInstallComponentMeta}
        setShowDialog={() => setInstallComponentMeta(null)}
      />
      {showAddRule && <AddRule hiddenChildren open onClose={() => setShowAddRule(false)} />}
      {showEnvironment && (
        <ComponentConfiguration
          open
          onClose={() => setShowEnvironment(false)}
          hiddenChildren
          blocklet={blocklet}
          ancestors={[]}
        />
      )}
      {showPreferences && (
        <BlockletPreferences open onClose={() => setShowPreferences(false)} blocklet={blocklet} ancestors={[]} />
      )}
    </Div>
  );
}

BlockletComponent.propTypes = {
  blocklet: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
  getComponentUrl: PropTypes.func,
};

const Div = styled.div`
  .title {
    font-size: 1.2rem;
    font-weight: bold;
  }

  @keyframes showDelay {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  .component-item {
    animation: showDelay 0.75s ease 1;
  }
`;

const TitleRow = styled(Box)`
  ${(props) => props.theme.breakpoints.up('sm')} {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  ${(props) => props.theme.breakpoints.down('sm')} {
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    .sm-hide-icon > svg {
      display: none;
    }
  }
`;

const TitleItem = styled(Box)`
  ${(props) => props.theme.breakpoints.down('sm')} {
    width: 100%;
    justify-content: space-between;
  }
`;
