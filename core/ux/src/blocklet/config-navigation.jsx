import { useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Toast from '@arcblock/ux/lib/Toast';
import { Icon } from '@iconify/react';
import { useCreation, useReactive } from 'ahooks';
import { Confirm } from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { SessionContext } from '@arcblock/did-connect-react/lib/Session';
import noop from 'lodash/noop';

import { NavigationProvider, useNavigation } from '../contexts/navigation';
import SortableTree from './component/sortable-tree';
import NavigationDialog from './component/navigation/navigation-dialog';
import NavigationActions from './component/navigation/navigation-actions';
import { useBlockletContext } from '../contexts/blocklet';
import NavigationPreview from './component/navigation/navigation-preview';
import { useTeamContext } from '../contexts/team';
import { formatError } from '../util';
import TabbarBuilder from './component/navigation/tabbar-builder';

// FIXME: 这里还有几处文案没有 i18n

const mockSession = {
  login: noop,
  logout: noop,
  switch: noop,
  switchDid: noop,
  switchProfile: noop,
  switchPassport: noop,
  useDid: () => {
    return { walletDid: 'abcdefghijklmnopqrstuvwxyz' };
  },
  useOAuth: () => {
    return {
      logoutOAuth: noop,
      bindOAuth: noop,
      configs: {},
      switchOAuthPassport: noop,
    };
  },
};

const navigationTypeMap = {
  header: 'Header',
  footer: 'Footer',
  bottom: 'Footer Link',
  social: 'Footer Social',
  dashboard: 'Dashboard',
  sessionManager: 'Session Blocklet',
  userCenter: 'User Center',
  bottomNavigation: 'Tab Bar',
};

function ConfigNavigationInner() {
  const { t } = useLocaleContext();
  const { blocklet } = useBlockletContext();
  const refNavigationDialog = useRef(null);
  const { roles } = useTeamContext();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const pageState = useReactive({
    saveLoading: false,
    resetLoading: false,
    showResetConfirm: false,
    mockRole: 'owner',
  });

  const {
    state: navigationState,
    navigation,
    getNavigation,
    saveNavigationList,
    resetNavigation,
    updateActiveSection,
    updateNavigationTree,
    updateNavigationItem,
    delNavigationItem,
    addNavigationItem,
  } = useNavigation();
  const isTabbar = navigationState.activeSection === 'bottomNavigation';

  const handleAddNavigation = useCallback(
    (params) => {
      refNavigationDialog.current.add({ parent: params }, (close, data) => {
        addNavigationItem(data);
        close();
      });
    },
    [addNavigationItem]
  );
  const handleEditNavigation = useCallback(
    (type, params = {}) => {
      switch (type) {
        case 'edit':
          refNavigationDialog.current.edit(params, (close, data) => {
            updateNavigationItem(data);
            close();
          });
          break;
        case 'toggle':
          updateNavigationItem({
            id: params.id,
            visible: !params.visible,
          });
          break;
        case 'del':
          delNavigationItem(params.id);
          break;
        default:
      }
    },
    [delNavigationItem, updateNavigationItem]
  );
  const handleSaveNavigation = useCallback(async () => {
    try {
      pageState.saveLoading = true;
      await saveNavigationList(navigationState.rawNavigation);
      Toast.success(t('common.succeeded'));
    } catch (e) {
      Toast.error(
        <Box>
          <Typography variant="subtitle2">{t('navigation.actionFailed')}</Typography>
          <Typography variant="body1">{formatError(e) || e.error}</Typography>
        </Box>
      );
    } finally {
      pageState.saveLoading = false;
    }
  }, [navigationState.rawNavigation, pageState, saveNavigationList, t]);

  const handleResetNavigation = useCallback(async () => {
    try {
      pageState.resetLoading = true;
      await resetNavigation(navigationState.activeSection);
      Toast.success(t('navigation.action.resetSuccessful'), { variant: 'success' });
    } catch (e) {
      Toast.error(
        <Box>
          <Typography variant="subtitle2">{t('navigation.actionFailed')}</Typography>
          <Typography variant="body1">{formatError(e) || e.error}</Typography>
        </Box>
      );
    } finally {
      pageState.resetLoading = false;
    }
  }, [pageState, resetNavigation, navigationState.activeSection, t]);

  const sessionCtxValue = useMemo(() => {
    return {
      session: {
        ...mockSession,
        user: { did: blocklet.appDid, fullName: 'Preview User', role: pageState.mockRole, isPreviewUser: true }, // 强制添加一个 isPreviewUser 属性，用于判断是否是预览用户
      },
    };
  }, [blocklet.appDid, pageState.mockRole]);

  const treeData = getNavigation(navigationState.activeSection);

  const disableAdd = useCreation(() => {
    if (navigationState.activeSection !== 'bottomNavigation') {
      return false;
    }
    if (treeData.length >= 5) {
      return true;
    }
    return false;
  }, [navigationState.activeSection, treeData.length]);

  const navConfig = (
    <>
      <Paper
        variant="outlined"
        sx={{ display: 'flex', height: 660, overflow: 'hidden', bgcolor: 'background.default' }}>
        <Paper elevation={0} sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default' }}>
          <SortableTree
            treeData={treeData}
            setTreeData={updateNavigationTree}
            renderActions={({ data, className }) => {
              return (
                <NavigationActions
                  data={data}
                  className={className}
                  section={navigationState.activeSection}
                  add={(...args) => handleAddNavigation(...args)}
                  del={(...args) => handleEditNavigation('del', ...args)}
                  edit={(...args) => handleEditNavigation('edit', ...args)}
                  toggle={(...args) => handleEditNavigation('toggle', ...args)}
                />
              );
            }}
          />
        </Paper>
      </Paper>
      <Toolbar variant="dense" sx={{ paddingLeft: '0px !important', paddingRight: '0px !important', mt: 3 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('common.preview')}
        </Typography>
        <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
          <InputLabel>{t('common.role')}</InputLabel>
          <Select
            value={pageState.mockRole}
            label="Role"
            onChange={(e) => {
              pageState.mockRole = e.target.value;
            }}>
            {roles.map((item) => (
              <MenuItem key={item.name} value={item.name}>
                {item.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Toolbar>
      <Paper variant="outlined">
        <SessionContext.Provider value={sessionCtxValue}>
          <NavigationPreview navigation={navigation} />
        </SessionContext.Provider>
      </Paper>
    </>
  );

  const tabbarConfig = <TabbarBuilder />;

  return (
    <>
      {isMobile && (
        <Select
          fullWidth
          size="small"
          value={navigationState.activeSection}
          onChange={(event) => updateActiveSection(event.target.value)}>
          {Object.keys(navigationTypeMap).map((key) => (
            <MenuItem value={key}>
              {navigationTypeMap[key]}
              {` (${getNavigation(key).length})`}
            </MenuItem>
          ))}
        </Select>
      )}
      {!isMobile && (
        <ButtonGroup variant="outlined">
          {Object.keys(navigationTypeMap).map((key) => {
            return (
              <Button
                key={key}
                variant={navigationState.activeSection === key ? 'contained' : undefined}
                onClick={() => updateActiveSection(key)}>
                {navigationTypeMap[key]}
                {` (${getNavigation(key).length})`}
              </Button>
            );
          })}
        </ButtonGroup>
      )}
      <Toolbar variant="dense" sx={{ paddingLeft: '0px !important', paddingRight: '0px !important', mt: 2 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('common.config')}
        </Typography>
        <ButtonGroup variant="outlined">
          <LoadingButton
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Icon icon="system-uicons:reset" />}
            sx={{ mr: 2 }}
            loading={pageState.resetLoading}
            loadingPosition="start"
            onClick={() => {
              pageState.showResetConfirm = true;
            }}>
            {t('navigation.action.reset')}
          </LoadingButton>
        </ButtonGroup>
        <ButtonGroup variant="outlined">
          {navigationState.activeSection !== 'bottomNavigation' && (
            <Button
              size="small"
              variant="outlined"
              disabled={disableAdd}
              startIcon={<Icon icon="mdi:plus" />}
              onClick={() => handleAddNavigation()}>
              {t('navigation.action.new')}
            </Button>
          )}
          <LoadingButton
            size="small"
            variant="contained"
            startIcon={<Icon icon="mdi:content-save" />}
            loading={pageState.saveLoading}
            loadingPosition="start"
            onClick={handleSaveNavigation}>
            {t('common.save')}
          </LoadingButton>
        </ButtonGroup>
      </Toolbar>
      {isTabbar ? tabbarConfig : navConfig}
      <NavigationDialog
        ref={refNavigationDialog}
        section={navigationState.activeSection}
        components={navigationState.components}
        rawNavigations={navigationState.rawNavigation}
      />
      <Confirm
        confirmButton={{
          text: t('common.confirm'),
          props: {
            variant: 'contained',
            color: 'error',
          },
        }}
        cancelButton={{
          text: t('common.cancel'),
          props: {
            color: 'primary',
          },
        }}
        open={pageState.showResetConfirm}
        title={t('navigation.action.restConfirmTitle', { section: navigationTypeMap[navigationState.activeSection] })}
        onConfirm={async () => {
          await handleResetNavigation();
          pageState.showResetConfirm = false;
        }}
        onCancel={() => {
          pageState.showResetConfirm = false;
        }}>
        <p>{t('navigation.action.restConfirmDesc')}</p>
      </Confirm>
    </>
  );
}

export default function ConfigNavigation() {
  return (
    <NavigationProvider>
      <ConfigNavigationInner />
    </NavigationProvider>
  );
}
