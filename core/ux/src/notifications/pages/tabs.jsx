/* eslint-disable react/require-default-props */
import { Box, Button } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import PropTypes from 'prop-types';
import { Fragment, useMemo, useContext } from 'react';
import ArrowDownwardIcon from '@arcblock/icons/lib/ArrowDown';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

const severityColors = {
  info: '#3B82F6', // 蓝色
  success: '#10B981', // 绿色
  warning: '#F59E0B', // 橙色
  error: '#EF4444', // 红色
};

SeverityDot.propTypes = {
  severity: PropTypes.oneOf(['info', 'success', 'warning', 'error', '']).isRequired,
  size: PropTypes.number,
};

export function SeverityDot({ severity, size = 8 }) {
  if (!severityColors[severity]) {
    return null;
  }
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: severityColors[severity] || severityColors.info,
      }}
    />
  );
}

NotificationTypes.propTypes = {
  theme: PropTypes.string,
  type: PropTypes.oneOf(['button', 'line', 'select']), // tab header 的类型，默认为 button
  onSelectType: PropTypes.func,
  extra: PropTypes.node,
  loading: PropTypes.bool,
  currentTab: PropTypes.oneOf(['info', 'success', 'warning', 'error', '']),
};

export default function NotificationTypes({
  theme = 'dark',
  type = 'button',
  onSelectType,
  extra = undefined,
  currentTab = '',
  loading = false,
  ...rest
}) {
  const { t } = useContext(LocaleContext);
  const tabs = [
    { label: t('notification.allSeverity'), value: '' },
    { label: t('notification.severityType.info'), value: 'info' },
    { label: t('notification.severityType.success'), value: 'success' },
    { label: t('notification.severityType.warning'), value: 'warning' },
    { label: t('notification.severityType.error'), value: 'error' },
  ];

  const handleClick = (tab) => {
    if (tab !== currentTab || !loading) {
      onSelectType(tab);
    }
  };

  const sx = useMemo(() => {
    const defaultSx = {
      width: '100%',
      bgcolor: theme === 'dark' ? '#F9FAFB' : '',
      overflowY: 'auto',
      paddingTop: type === 'select' ? '0' : '5px',
      whiteSpace: 'nowrap',
      borderRadius: 0,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      gap: '8px',
    };
    if (type === 'line') {
      return Object.assign(defaultSx, {});
    }
    return defaultSx;
  }, [type, theme]);

  const buttonTab = (item, active, index) => {
    return (
      <Button
        disabled={loading}
        key={item.value || index}
        onClick={() => handleClick(item.value)}
        className={`profile-button ${active ? 'active' : ''}`}
        {...rest}>
        {item.label}
      </Button>
    );
  };

  const lineTab = (item, active, index) => {
    return (
      <Button
        variant="text"
        disabled={loading}
        key={item.value || index}
        onClick={() => handleClick(item.value)}
        className={`profile-line-button ${active ? 'active' : ''}`}
        {...rest}>
        {item.label}
      </Button>
    );
  };

  const renderTab = () => {
    return tabs?.map((item, index) => {
      const isActive = currentTab === item?.value;
      if (type === 'line') {
        return <Fragment key={item.value || index}>{lineTab(item, isActive, index)}</Fragment>;
      }
      return <Fragment key={item.value || index}>{buttonTab(item, isActive, index)}</Fragment>;
    });
  };

  const handleSelectChange = (e) => {
    const { value } = e.target;
    handleClick(value === 'all' ? '' : value);
  };

  if (type === 'select') {
    return (
      <FormControl sx={{ maxWidth: 300 }}>
        <Select
          value={currentTab || 'all'}
          onChange={handleSelectChange}
          size="small"
          label="Severity"
          // eslint-disable-next-line react/no-unstable-nested-components
          IconComponent={(props) => <ArrowDownwardIcon {...props} width={20} height={20} />}
          MenuProps={{
            autoFocus: false,
            PaperProps: {
              style: {
                maxHeight: 400, // 设置最大高度为 200px
                overflowY: 'auto', // 确保内容可滚动
                borderRadius: '8px', // 添加圆角
                boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.15)',
              },
            },
          }}
          variant="outlined"
          sx={{
            fieldset: { border: 'none' },
          }}>
          {tabs.map((item, index) => (
            <MenuItem key={item.value || index} value={item.value || 'all'}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}>
                <SeverityDot severity={item.value} />
                {item.label}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }
  return (
    <Box className="severity-tabs" sx={sx}>
      <Box
        sx={{
          ...(type === 'line'
            ? { flex: 1, borderBottom: '1px solid', borderColor: 'grey.200' }
            : { display: 'flex', gap: '24px' }),
        }}>
        {renderTab()}
      </Box>
      {extra}
    </Box>
  );
}
