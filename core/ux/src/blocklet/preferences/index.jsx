import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { useReactive } from 'ahooks';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import GeneralIcon from '@mui/icons-material/TuneRounded';
import KeyIcon from '@mui/icons-material/Key';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import DnsIcon from '@mui/icons-material/Dns';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import iconViewHeadlineRounded from '@iconify-icons/material-symbols/view-headline-rounded';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Tabs from '@arcblock/ux/lib/Tabs';
import { getDisplayName } from '@blocklet/meta/lib/util';

import BlockletBundleAvatar from '../bundle-avatar';
import BlockletAppAvatar from '../app-avatar';
import BlockletConfiguration from '../configuration';
import BlockletNotification from '../notification';
import Authentication from '../authentication';
import BlockletSecurity from '../security';
import BlockletAccessPolicy from '../security/access-policy';
import BlockletResponseHeaderPolicy from '../security/response-header-policy';
import BlockletPreference from './preference';
import SubServiceConfig from '../sub-service';
import useMobile from '../../hooks/use-mobile';

const addComponentTabs = ({ tabs, blocklet, ancestors = [], depth = 1, t }) => {
  const key = [...ancestors.map((x) => x.meta.did), blocklet.meta.did].join('/');
  const isContainer = !ancestors?.length;

  tabs.push({
    label: (
      <Box
        key={key}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          pl: Math.max(1, depth - 1) * 2,
        }}>
        {isContainer ? (
          <BlockletAppAvatar size={24} blocklet={blocklet} style={{ borderRadius: 0 }} />
        ) : (
          <BlockletBundleAvatar size={24} blocklet={blocklet} ancestors={ancestors} style={{ borderRadius: 0 }} />
        )}
        <Box
          sx={{
            ml: 2,
          }}>
          <Box sx={{ color: 'text.primary' }}>
            {isContainer ? t('blocklet.component.container') : getDisplayName(blocklet, true)}
          </Box>
        </Box>
      </Box>
    ),
    value: key,
  });

  if (blocklet.children.length > 0) {
    blocklet.children.forEach((x) => {
      addComponentTabs({ tabs, blocklet: x, ancestors: [...ancestors, blocklet], depth: depth + 1, t });
    });
  }
};

export default function BlockletPreferences({ blocklet, onUpdate = () => {}, ...rest }) {
  const { t } = useLocaleContext();
  const currentState = useReactive({
    expandPref: true,
    expandSecurity: true,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const current = searchParams.get('tab') || 'general';
  const isMobile = useMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tabs = [];
  tabs.push({
    label: (
      <Box
        key="general"
        data-cy="configuration-tab-general"
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}>
        <GeneralIcon sx={{ fontSize: 24 }} />
        <Box sx={{ ml: 2, color: 'text.primary' }}>{t('common.general')}</Box>
      </Box>
    ),
    value: 'general',
  });
  tabs.push({
    label: (
      <Box
        key="subService"
        data-cy="configuration-tab-sub-service"
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}>
        <DnsIcon sx={{ fontSize: 24 }} />
        <Box sx={{ ml: 2, color: 'text.primary' }}>{t('blocklet.subService.title')}</Box>
      </Box>
    ),
    value: 'subService',
  });
  tabs.push({
    label: (
      <Box
        key="securityGroup"
        data-cy="configuration-tab-security-group"
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}>
        <Box sx={{ ml: -2, transform: 'translateY(2px)' }}>
          {currentState.expandSecurity ? (
            <ExpandMoreIcon fontSize="inherit" />
          ) : (
            <ChevronRightIcon fontSize="inherit" />
          )}
        </Box>
        <LockIcon sx={{ fontSize: 24 }} />
        <Box sx={{ ml: 2, color: 'text.primary' }}>{t('common.security')}</Box>
      </Box>
    ),
    value: 'securityGroup',
  });
  if (currentState.expandSecurity) {
    tabs.push({
      label: (
        <Box
          key="security"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            pl: 2,
          }}>
          <LockIcon sx={{ fontSize: 24 }} />
          <Box sx={{ ml: 2, color: 'text.primary' }}>{t('securityRule.title')}</Box>
        </Box>
      ),
      value: 'security',
    });
    tabs.push({
      label: (
        <Box
          key="accessPolicy"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            pl: 2,
          }}>
          <KeyIcon sx={{ fontSize: 24 }} />
          <Box sx={{ ml: 2, color: 'text.primary' }}>{t('accessPolicy.title')}</Box>
        </Box>
      ),
      value: 'accessPolicy',
    });
    tabs.push({
      label: (
        <Box
          key="responseHeaderPolicy"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            pl: 2,
          }}>
          <Icon fontSize={24} style={{ flexShrink: 0 }} icon={iconViewHeadlineRounded} />
          <Box sx={{ ml: 2, color: 'text.primary' }}>{t('responseHeaderPolicy.title')}</Box>
        </Box>
      ),
      value: 'responseHeaderPolicy',
    });
  }
  tabs.push({
    label: (
      <Box
        key="authentication"
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
        data-cy="configuration-tab-authentication">
        <LoginIcon sx={{ fontSize: 24 }} />
        <Box sx={{ ml: 2, color: 'text.primary' }}>{t('common.login')}</Box>
      </Box>
    ),
    value: 'authentication',
  });
  tabs.push({
    label: (
      <Box
        key="notification"
        data-cy="configuration-tab-notification"
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}>
        <NotificationsNoneIcon sx={{ fontSize: 24 }} />
        <Box sx={{ ml: 2, color: 'text.primary' }}>{t('common.notification')}</Box>
      </Box>
    ),
    value: 'notification',
  });
  tabs.push({
    label: (
      <Box
        key="preference"
        data-cy="configuration-tab-preference"
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}>
        <Box sx={{ ml: -2, transform: 'translateY(2px)' }}>
          {currentState.expandPref ? <ExpandMoreIcon fontSize="inherit" /> : <ChevronRightIcon fontSize="inherit" />}
        </Box>
        <SettingsOutlinedIcon sx={{ fontSize: 24 }} />
        <Box sx={{ ml: 2, color: 'text.primary' }}>{t('common.preferences')}</Box>
      </Box>
    ),
    value: 'preference',
  });
  const currentTab = tabs.find((tab) => tab.value === current);

  if (currentState.expandPref) {
    addComponentTabs({ tabs, blocklet, t });
  }

  const onTabChange = (x) => {
    if (x === 'preference') {
      currentState.expandPref = !currentState.expandPref;
    } else if (x === 'securityGroup') {
      currentState.expandSecurity = !currentState.expandSecurity;
    } else {
      setSearchParams((prev) => {
        if (x === 'general') {
          prev.delete('tab');
        } else {
          prev.set('tab', x);
        }
        return prev;
      });
    }
    setDrawerOpen(false);
  };

  let content = null;
  if (current === 'general') {
    content = <BlockletConfiguration blocklet={blocklet} onUpdate={onUpdate} />;
  } else if (current === 'subService') {
    content = <SubServiceConfig blocklet={blocklet} />;
  } else if (current === 'security') {
    content = <BlockletSecurity />;
  } else if (current === 'accessPolicy') {
    content = <BlockletAccessPolicy />;
  } else if (current === 'responseHeaderPolicy') {
    content = <BlockletResponseHeaderPolicy />;
  } else if (current === 'authentication') {
    content = <Authentication />;
  } else if (current === 'notification') {
    content = <BlockletNotification />;
  } else {
    content = <BlockletPreference id={current} />;
  }

  const tabBodyStyle = useMemo(() => {
    return {
      position: 'relative',
      minHeight: '66vh',
      height: '100%',
      overflow: 'hidden',
    };
  }, []);

  return (
    <Div {...rest}>
      {/* 移动端导航 */}
      {isMobile && (
        <>
          <Box
            sx={{
              color: 'primary.main',
              position: 'sticky',
              top: 0,
              zIndex: 2,
              bgcolor: 'background.default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}>
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <Box>{currentTab?.label}</Box>
          </Box>
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            slotProps={{
              paper: {
                sx: {
                  width: 260,
                  '.MuiTab-root': {
                    textAlign: 'left',
                    alignItems: 'flex-start',
                    fontWeight: 'normal',
                  },
                },
              },
            }}>
            <Tabs
              tabs={tabs}
              current={current}
              orientation="vertical"
              onChange={onTabChange}
              sx={{ borderRight: 1, height: '100%', borderColor: 'divider' }}
            />
          </Drawer>
        </>
      )}
      <Grid container spacing={4} columns={24}>
        {/* PC 导航 */}
        {!isMobile && (
          <Grid
            size={{
              xs: 24,
              sm: 7,
              md: 5,
            }}>
            <Tabs
              tabs={tabs}
              current={current}
              orientation="vertical"
              onChange={onTabChange}
              sx={{ borderRight: 1, height: '100%', borderColor: 'divider' }}
            />
          </Grid>
        )}
        <Grid
          size={{
            xs: 24,
            sm: 17,
            md: 19,
          }}>
          <Box style={tabBodyStyle}>{content}</Box>
        </Grid>
      </Grid>
    </Div>
  );
}

BlockletPreferences.propTypes = {
  blocklet: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
};

const Div = styled.div`
  .MuiTab-root {
    text-align: left;
    align-items: flex-start;
    font-weight: normal;
  }
  .Mui-selected {
    font-weight: bold;
  }
`;
