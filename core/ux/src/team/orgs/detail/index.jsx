/**
 * org 详情页
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Empty from '@arcblock/ux/lib/Empty';

import Breadcrumb from './breadcrumb';
import Basic from './basic';
import Tabs from './tabs';
import { useOrgsContext } from '../context';
import OrgMembers, { MemberExtra } from './members';
import OrgSettings from './settings';
import OrgPassports, { OrgPassportsExtra } from './passports';

export default function OrgDetail({ id = '', inDialog = false }) {
  const { orgDetail } = useOrgsContext();
  const { t } = useLocaleContext();

  const [currentTab, setCurrentTab] = useState('members');

  const { org, loading, refresh, error } = orgDetail || {};

  const tabs = [
    { label: t('team.orgs.members'), value: 'members' },
    { label: t('common.settings'), value: 'settings' },
    { label: t('team.member.passports'), value: 'passports' },
  ];

  useEffect(() => {
    if (id && inDialog) {
      refresh(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, inDialog]);

  if (error) {
    return <Empty>{error}</Empty>;
  }
  if (!org) {
    return null;
  }

  const renderTabs = () => {
    if (currentTab === 'members') {
      return <MemberExtra />;
    }
    if (currentTab === 'passports') {
      return <OrgPassportsExtra />;
    }
    return null;
  };

  return (
    <Box>
      {!inDialog && <Breadcrumb org={org} loading={loading} />}
      <Box sx={{ mt: 2 }}>
        <Basic org={org} loading={loading} />
        <Box sx={{ mt: 1, p: 2, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
          <Tabs
            tabs={tabs}
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            loading={loading}
            extra={renderTabs()}
          />
          <Box sx={{ mt: 2 }}>
            {currentTab === 'members' && <OrgMembers />}
            {currentTab === 'settings' && <OrgSettings />}
            {currentTab === 'passports' && <OrgPassports />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

OrgDetail.propTypes = {
  id: PropTypes.string,
  inDialog: PropTypes.bool,
};
