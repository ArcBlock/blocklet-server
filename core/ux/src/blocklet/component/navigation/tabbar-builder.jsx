/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Paper, Typography, useMediaQuery, Fade, styled, useTheme } from '@mui/material';
import Icon from '@blocklet/ui-react/lib/Icon';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import { Confirm } from '@arcblock/ux/lib/Dialog';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import Iframe from 'react-iframe';
import { joinURL } from 'ufo';
import isPlainObject from 'lodash/isPlainObject';

import { useBlockletContext } from '../../../contexts/blocklet';
import ColoredIcon from './colored-icon';
import { useNavigation } from '../../../contexts/navigation';
import NavigationForm from './navigation-form';
import NavigationDialog from './navigation-dialog';
import { useNodeContext } from '../../../contexts/node';

const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 667;
const TAB_BAR_HEIGHT = 56;

// 模拟手机外壳的样式组件
const PhoneFrame = styled(Paper)(({ theme }) => ({
  width: MOBILE_WIDTH,
  height: MOBILE_HEIGHT,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 32,
  position: 'relative',
}));

// 底部导航栏样式
const TabBar = styled(Box)(({ theme }) => ({
  height: TAB_BAR_HEIGHT,
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  backgroundColor: theme.palette.background.paper,
}));

// Tab 项样式
const TabItem = styled(Box)(({ theme, active }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  position: 'relative',
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

// 修改 TabToolbar 样式
const TabToolbar = styled(Box)(({ theme, left }) => ({
  position: 'absolute',
  bottom: -TAB_BAR_HEIGHT,
  left,
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  boxShadow: theme.shadows[2],
  zIndex: 1,
}));

const ToolbarButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  '&:not(:last-child)': {
    marginRight: theme.spacing(0.5),
  },
}));

// 添加 IframeContainer 样式
const IframeContainer = styled(Box)({
  flexGrow: 1,
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
});

// 添加右侧编辑区域样式
const EditPanel = styled(Box)(({ theme }) => ({
  width: 400,
  paddingLeft: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
  height: MOBILE_HEIGHT,
  overflowY: 'auto',
}));

export default function TabbarBuilder() {
  const { t, locale } = useLocaleContext();
  const { blocklet } = useBlockletContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { state, getNavigation, updateNavigationItem, addNavigationItem, delNavigationItem, updateNavigationTree } =
    useNavigation();
  const { inService } = useNodeContext();
  const toolbarRef = useRef(null);
  const navigationFormRef = useRef(null);
  const navigationDialogRef = useRef(null);
  const customUrl = blocklet.environments.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL);
  const activeColor = blocklet?.settings?.theme?.light?.palette?.primary?.main;
  const [toolbarLeft, setToolbarLeft] = useState(0);
  const [showDelConfirm, setShowDelConfirm] = useState(false);
  const lastToolbarLeft = useRef(0);
  const addIndexRef = useRef(null);

  const tabs = getNavigation('bottomNavigation');
  const showTabs = tabs.length > 0;
  const canAddMore = tabs.length < 5;
  const [selectedTab, setSelectedTab] = useState(tabs.length > 0 ? tabs[0] : null);
  const activeTabIndex = tabs.findIndex((tab) => tab.id === selectedTab?.id);

  const getI18nVal = useMemoizedFn(
    (obj, key) => {
      const val = obj?.[key];
      return isPlainObject(val) ? val[locale] || val.en : val;
    },
    [locale]
  );

  const handleTabClick = useMemoizedFn((tab) => {
    if (tab.id !== selectedTab?.id) {
      setSelectedTab(tab);
    }
  });
  const handleAddTab = useMemoizedFn((index) => {
    addIndexRef.current = index;
    navigationDialogRef.current?.add({}, (close, newTab) => {
      const newItem = addNavigationItem(newTab, addIndexRef.current);
      setSelectedTab(newItem);
      close();
    });
  });

  const handleDeleteTab = useMemoizedFn(() => {
    setShowDelConfirm(true);
  });

  const handleEditTab = useMemoizedFn(() => {
    navigationDialogRef.current?.edit(selectedTab, (close, newTab) => {
      updateNavigationItem(newTab);
      close();
    });
  });

  const { run } = useDebounceFn(
    () => {
      navigationFormRef.current?.submit();
    },
    {
      wait: 300,
    }
  );
  const handleNavFormChange = useMemoizedFn(run);

  const withDomain = useMemoizedFn(
    (url) => {
      if (url?.startsWith('/')) {
        try {
          const baseUrl = inService ? window.location.origin : customUrl?.value;
          return new URL(url, baseUrl).href;
        } catch {
          console.error('Failed to resolve url: ', url);
        }
      }
      return url;
    },
    [customUrl?.value, inService]
  );

  const handleDragEnd = useMemoizedFn((result) => {
    if (!result.destination) return;

    const newOrder = Array.from(tabs);
    const [removed] = newOrder.splice(result.source.index, 1);

    newOrder.splice(result.destination.index, 0, removed);
    updateNavigationTree(newOrder);
  });

  // 获取当前激活 tab 的链接
  const getActiveTabLink = useMemoizedFn(() => {
    const tab = tabs.find((v) => v.id === selectedTab?.id);
    if (!tab) return '';

    // 处理 link 中的语言变量
    let link = getI18nVal(tab, 'link') || '/';

    // 如果是相对路径，需要添加域名
    if (link.startsWith('/')) {
      try {
        link = withDomain(joinURL(tab.__base || '/', link));
      } catch (err) {
        console.error('Failed to get active tab link', err);
        return '';
      }
    }

    return link;
  });

  // 监听 selectedTab 变化，更新表单数据
  useEffect(() => {
    if (selectedTab && !isMobile) {
      navigationFormRef.current?.resetImmediate();
      navigationFormRef.current?.edit(selectedTab, (newTab) => {
        updateNavigationItem(newTab);
      });
    }
  }, [selectedTab, updateNavigationItem, isMobile]);

  // 计算 toolbar 的位置
  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.id === selectedTab?.id);
    if (index === -1 || !toolbarRef.current) return setToolbarLeft(lastToolbarLeft.current);

    // 计算选中 tab 的中心位置
    const tabWidth = MOBILE_WIDTH / tabs.length; // 手机宽度除以 tab 数量
    const tabCenter = tabWidth * (index + 0.5);

    // 限制位置，确保 toolbar 不会超出边框
    const toolbarWidth = toolbarRef.current.getBoundingClientRect().width;
    const minLeft = toolbarWidth / 2 + 16; // 左边界 + 边距
    const maxLeft = MOBILE_WIDTH - (toolbarWidth / 2 + 16); // 右边界 - 边距
    const left = Math.min(Math.max(tabCenter, minLeft), maxLeft);
    lastToolbarLeft.current = left;

    return setToolbarLeft(left);
  }, [selectedTab, tabs, lastToolbarLeft]);

  // 默认选中第一个 tab
  useEffect(() => {
    if (tabs.length > 0 && !selectedTab) setSelectedTab(tabs[0]);
  }, [tabs, selectedTab]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'flex-start', margin: '4px auto 0' }}>
        <PhoneFrame elevation={2}>
          {/* 预览 */}
          <IframeContainer>
            {showTabs && (
              <Iframe
                url={getActiveTabLink()}
                width="100%"
                height="100%"
                id="tabbar-preview"
                className="tabbar-preview-iframe"
                display="block"
                position="relative"
                styles={{
                  border: 'none',
                  background: '#fff',
                }}
              />
            )}
          </IframeContainer>
          {/* 底部导航栏 */}
          <Box sx={{ height: TAB_BAR_HEIGHT, overflowY: 'auto', flexShrink: 0 }}>
            {showTabs && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="tabbar" direction="horizontal">
                  {(provided) => (
                    <TabBar ref={provided.innerRef} {...provided.droppableProps}>
                      {tabs.map((tab, index) => (
                        <Draggable key={tab.id} draggableId={tab.id} index={index}>
                          {(dragProvided, snapshot) => (
                            <TabItem
                              className="tab-item"
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              active={tab.id === selectedTab?.id}
                              onClick={(e) => handleTabClick(tab, e)}
                              sx={{
                                color: tab.id === selectedTab?.id ? activeColor : 'text.secondary',
                                opacity: snapshot.isDragging ? 0.5 : 1,
                              }}>
                              <ColoredIcon
                                src={withDomain(tab.icon)}
                                color={tab.id === selectedTab?.id ? activeColor : theme.palette.text.secondary}
                                size={24}
                              />
                              <Typography variant="caption">{getI18nVal(tab, 'title')}</Typography>
                            </TabItem>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </TabBar>
                  )}
                </Droppable>
              </DragDropContext>
            )}
            {!showTabs && (
              <TabBar>
                <TabItem className="tab-item" onClick={() => handleAddTab(0)}>
                  <Icon icon="mdi:plus-circle-outline" size={28} />
                </TabItem>
              </TabBar>
            )}
          </Box>
        </PhoneFrame>
        {/* 实时编辑 */}
        {!isMobile && showTabs && (
          <EditPanel>
            {selectedTab && (
              <NavigationForm
                ref={navigationFormRef}
                sx={{ p: 0 }}
                section="bottomNavigation"
                components={state.components}
                rawNavigations={state.rawNavigation}
                onChange={handleNavFormChange}
              />
            )}
          </EditPanel>
        )}
        {/* 工具栏 */}
        <Fade in={selectedTab !== null}>
          <TabToolbar ref={toolbarRef} left={toolbarLeft}>
            <ToolbarButton size="small" disabled={!canAddMore} onClick={() => handleAddTab(activeTabIndex)}>
              <Icon icon="mdi:plus-circle-outline" size={28} />
            </ToolbarButton>
            {isMobile && (
              <ToolbarButton size="small" onClick={() => handleEditTab()}>
                <Icon icon="mdi:edit-box-outline" size={28} />
              </ToolbarButton>
            )}
            <ToolbarButton size="small" onClick={() => handleDeleteTab()}>
              <Icon icon="mdi:delete-outline" size={28} />
            </ToolbarButton>
            <ToolbarButton size="small" disabled={!canAddMore} onClick={() => handleAddTab(activeTabIndex + 1)}>
              <Icon icon="mdi:plus-circle-outline" size={28} />
            </ToolbarButton>
          </TabToolbar>
        </Fade>
        {/* 弹框编辑 */}
        <NavigationDialog
          ref={navigationDialogRef}
          section="bottomNavigation"
          components={state.components}
          rawNavigations={state.rawNavigation}
        />
        {/* 删除确认 */}
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
          open={showDelConfirm}
          title={t('navigation.action.delTabBarTitle')}
          onConfirm={() => {
            setShowDelConfirm(false);
            delNavigationItem(selectedTab.id);
            if (tabs.length > 1) {
              if (activeTabIndex > 0) setSelectedTab(tabs[activeTabIndex - 1]);
              else setSelectedTab(tabs[activeTabIndex + 1]);
            } else setSelectedTab(null);
          }}
          onCancel={() => {
            setShowDelConfirm(false);
          }}>
          <p>{t('navigation.action.delTabBarDesc')}</p>
        </Confirm>
      </Box>
    </Box>
  );
}
