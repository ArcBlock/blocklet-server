import React from 'react';
import PropTypes from 'prop-types';
import { Box, Skeleton, ToggleButtonGroup, ToggleButton } from '@mui/material';

export default function Tabs({ tabs, currentTab, onTabChange, loading = false, extra = null }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      {loading ? (
        <Skeleton variant="text" width={300} height={56} />
      ) : (
        <ToggleButtonGroup
          color="primary"
          size="small"
          value={currentTab}
          exclusive
          onChange={(event, newValue) => {
            if (newValue !== null) {
              onTabChange(newValue);
            }
          }}
          disabled={loading}>
          {tabs.map((tab) => (
            <ToggleButton key={tab.value} size="small" value={tab.value}>
              {tab.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
      <Box>{extra}</Box>
    </Box>
  );
}

Tabs.propTypes = {
  tabs: PropTypes.array.isRequired,
  currentTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  extra: PropTypes.node,
};
