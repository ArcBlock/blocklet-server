/* eslint-disable react/require-default-props */

/**
 * 根据 notification 的 severity 返回对应的 avatar
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Avatar, useTheme } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useCreation } from 'ahooks';
import { alpha } from '@mui/material/styles';

// Map severity to appropriate icon component
const severityIcons = {
  error: CancelIcon,
  warning: WarningIcon,
  info: InfoIcon,
  success: CheckCircleIcon,
};

SeverityAvatar.propTypes = {
  severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']).isRequired,
  size: PropTypes.number,
};

export default function SeverityAvatar({ severity = 'info', size = 32 }) {
  const theme = useTheme();
  // Define severity colors as provided by the user
  const severityColors = useCreation(() => ({
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
    success: theme.palette.success.main,
  }));

  const color = severityColors[severity];
  const IconComponent = severityIcons[severity];

  // Create lighter background color by adding transparency
  const bgColor = alpha(color, 0.1);

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: bgColor,
        color,
      }}>
      <IconComponent fontSize="small" />
    </Avatar>
  );
}
