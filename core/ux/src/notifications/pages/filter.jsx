/**
 * 消息过滤组件
 */
import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import IconButton from '@mui/material/IconButton';
import { Icon } from '@iconify/react';
import FilterIcon from '@iconify-icons/tabler/filter';
import SearchIcon from '@iconify-icons/tabler/search';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import { SeverityDot } from './tabs';
import BundleAvatar from '../../blocklet/bundle-avatar';

// 每页显示的组件数
const COMPONENTS_PER_PAGE = 6;

// 自定义样式
const checkboxStyles = {
  '& .MuiCheckbox-root': {
    padding: '4px',
  },
  '& .MuiCheckbox-root .MuiSvgIcon-root': {
    fontSize: '1.35rem',
  },
  '& .MuiCheckbox-root:not(.Mui-checked)': {
    color: 'divider',
  },
  '& .MuiCheckbox-root.Mui-checked': {
    color: 'primary.main',
  },
  '& .MuiCheckbox-root .css-i4bv87-MuiSvgIcon-root': {
    width: '1.1em',
    height: '1.1em',
  },
  '& .MuiCheckbox-root svg': {
    stroke: 'divider',
    strokeWidth: 0.7,
  },
};

const optionPaperStyles = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1, // 增加圆角
  overflow: 'hidden',
  backgroundColor: 'background.paper',
  backgroundImage: 'none',
  transition: 'all 0.2s ease-in-out',
};

// 创建一个函数来动态生成选项样式
const getOptionPaperStyle = () => ({
  ...optionPaperStyles,
  width: 'calc(50% - 8px)',
});

NotificationFilter.propTypes = {
  loading: PropTypes.bool,
  type: PropTypes.oneOf(['server', 'service']), // 类型，默认为 server
  onFilterChange: PropTypes.func,
  blockletMap: PropTypes.object,
  filterType: PropTypes.oneOf(['component', 'entity']),
  selectedId: PropTypes.array,
  severity: PropTypes.array,
  enableMarkAllAsRead: PropTypes.bool,
  unReadCount: PropTypes.number,
  onReadFilterChange: PropTypes.func,
  currentReadFilter: PropTypes.string,
};

export default function NotificationFilter({
  onFilterChange = () => {},
  loading = false,
  type = 'service',
  blockletMap = {},
  filterType = 'component',
  selectedId = [],
  severity = [],
  enableMarkAllAsRead = true,
  unReadCount = 0,
  onReadFilterChange = () => {},
  currentReadFilter = 'all',
}) {
  const { t } = useContext(LocaleContext);

  // 添加状态来控制弹出层
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // 添加状态来跟踪选中的组件
  const [selectedComponents, setSelectedComponents] = useState(selectedId);

  // 添加状态来跟踪选中的严重级别
  const [selectedSeverities, setSelectedSeverities] = useState(severity);

  // 添加状态控制组件列表的展开/折叠
  const [expanded, setExpanded] = useState(false);

  // 添加状态用于组件搜索
  const [searchTerm, setSearchTerm] = useState('');

  // 添加状态用于过滤后的组件列表
  const [filteredComponents, setFilteredComponents] = useState([]);

  useEffect(() => {
    setSelectedComponents(selectedId);
    setSelectedSeverities(severity);
  }, [selectedId, severity]);

  // 标签选项
  const readFilterTabs = [
    { label: t('notification.filterType.all'), value: 'all' },
    { label: t('notification.filterType.unread'), value: 'unread' },
  ];

  // 处理标签点击
  const handleTabClick = (tabValue) => {
    if (tabValue !== currentReadFilter || !loading) {
      onReadFilterChange(tabValue);
    }
  };

  // 严重级别选项
  const severityOptions = [
    { label: t('notification.severityType.info'), value: 'info' },
    { label: t('notification.severityType.success'), value: 'success' },
    { label: t('notification.severityType.warning'), value: 'warning' },
    { label: t('notification.severityType.error'), value: 'error' },
  ];

  // 处理打开过滤弹出层
  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
    // 重置搜索和展开状态
    setSearchTerm('');
    setExpanded(false);
  };

  // 处理关闭过滤弹出层
  const handleClose = () => {
    setAnchorEl(null);
  };

  // 处理组件选项变更
  const handleComponentChange = (componentId) => {
    const newSelectedComponents = selectedComponents.includes(componentId)
      ? selectedComponents.filter((id) => id !== componentId)
      : [...selectedComponents, componentId];

    setSelectedComponents(newSelectedComponents);
    onFilterChange({ id: newSelectedComponents, severity: selectedSeverities });
  };

  // 处理严重级别选项变更
  const handleSeverityChange = (severityValue) => {
    const newSelectedSeverities = selectedSeverities.includes(severityValue)
      ? selectedSeverities.filter((s) => s !== severityValue)
      : [...selectedSeverities, severityValue];

    setSelectedSeverities(newSelectedSeverities);
    onFilterChange({ severity: newSelectedSeverities, id: selectedComponents });
  };

  // 处理搜索词变化
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // 处理展开/折叠按钮点击
  const handleExpandToggle = () => {
    setExpanded(!expanded);
  };

  // 获取所有组件选项
  const componentOptions = React.useMemo(() => {
    if (!blockletMap.size) {
      return [];
    }

    const result = [];

    // 如果是组件类型过滤，添加"系统"选项
    if (filterType === 'component') {
      result.push({ label: t('notification.system'), id: 'system' });
    }

    // 添加所有组件
    Array.from(blockletMap).forEach(([, x]) => {
      const did = x.did || x.meta?.did;
      const title = x.title || x.meta?.title || '';
      const appDid = x.appPid || x.appDid;

      if ((filterType === 'component' && appDid !== did) || (filterType === 'entity' && appDid === did)) {
        result.push({
          label: title,
          id: did,
          blocklet: x,
          ancestors: x.ancestors,
        });
      }
    });

    return result;
  }, [blockletMap, filterType, t]);

  // 根据搜索词过滤组件列表
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredComponents(componentOptions);
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filtered = componentOptions.filter((option) => option.label.toLowerCase().includes(lowerSearchTerm));
      setFilteredComponents(filtered);
    }
  }, [searchTerm, componentOptions]);

  // 确定当前显示的组件列表
  const displayedComponents =
    searchTerm.trim() !== '' || expanded ? filteredComponents : filteredComponents.slice(0, COMPONENTS_PER_PAGE);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: enableMarkAllAsRead ? 'space-between' : 'flex-end',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 1,
        }}>
        {enableMarkAllAsRead && (
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
            }}>
            {readFilterTabs.map((tab) => (
              <Button
                key={tab.value}
                disabled={loading}
                onClick={() => handleTabClick(tab.value)}
                className={`profile-button ${currentReadFilter === tab.value ? 'active' : ''}`}
                sx={{
                  ...(type === 'service' && currentReadFilter === tab.value ? { color: 'secondary.main' } : {}),
                  color: 'red',
                  fontWeight: currentReadFilter === tab.value ? 'bold' : 'normal',
                }}>
                {tab.label}
                {tab.value === 'unread' && unReadCount > 0 && ` (${unReadCount})`}
              </Button>
            ))}
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
          }}>
          <IconButton
            size="small"
            onClick={handleFilterClick}
            disabled={loading}
            sx={{
              minWidth: 'auto',
              borderRadius: 1, // 添加适当的圆角
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover', // 悬停效果
              },
            }}>
            <Icon icon={FilterIcon} hFlip />
          </IconButton>
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            slotProps={{
              paper: {
                sx: {
                  p: 3,
                  width: 450, // 增加弹出层宽度
                  maxHeight: 500,
                  overflowY: 'auto',
                  backgroundColor: 'background.paper',
                  backgroundImage: 'none',
                  borderRadius: 1,
                  boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.15)',
                },
              },
            }}>
            <Box>
              {/* 添加清空所有筛选条件按钮到右上角 */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  height: '28px',
                }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 'bold',
                  }}>
                  {t('notification.severity')}
                </Typography>
                <Box
                  sx={{
                    minWidth: '60px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}>
                  {(selectedComponents.length > 0 || selectedSeverities.length > 0) && (
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedComponents([]);
                        setSelectedSeverities([]);
                        onFilterChange({ severity: [], id: [] });
                      }}
                      startIcon={<CloseIcon fontSize="small" />}
                      sx={{
                        color: 'text.secondary',
                        textTransform: 'none',
                        minWidth: 'auto',
                        '&:hover': {
                          backgroundColor: 'transparent',
                        },
                        '& .MuiButton-startIcon': {
                          marginRight: '2px',
                        },
                      }}>
                      {t('notification.clear')}
                    </Button>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <FormGroup sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2, flex: 1 }}>
                  {severityOptions.map((option) => (
                    <Paper
                      key={option.value}
                      elevation={0}
                      sx={getOptionPaperStyle(selectedSeverities.includes(option.value))}>
                      <FormControlLabel
                        sx={{
                          margin: 0,
                          padding: 0.5,
                          width: '100%',
                          '& .MuiFormControlLabel-label': {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            fontSize: '0.875rem',
                          },
                          ...checkboxStyles,
                        }}
                        control={
                          <Checkbox
                            checked={selectedSeverities.includes(option.value)}
                            onChange={() => handleSeverityChange(option.value)}
                            disabled={loading}
                            size="small"
                          />
                        }
                        label={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              gap: 0.5,
                            }}>
                            <SeverityDot severity={option.value} />
                            {option.label}
                          </Box>
                        }
                      />
                    </Paper>
                  ))}
                </FormGroup>
              </Box>

              <Box
                sx={{
                  mb: 2,
                }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 1.5,
                  }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 'bold',
                      width: 'calc(100% - 36px)',
                    }}>
                    {t('notification.from')}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      width: 'calc(100% - 36px)',
                    }}>
                    <TextField
                      size="small"
                      placeholder="search"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-input': {
                          padding: '6px 4px 6px 0',
                        },
                        '.MuiOutlinedInput-root': {
                          '&:hover': {
                            fieldset: {
                              borderColor: 'divider',
                            },
                          },
                          '&.Mui-focused': {
                            fieldset: {
                              borderColor: 'divider',
                            },
                          },
                        },
                        fieldset: {
                          borderColor: 'divider',
                        },
                      }}
                      slotProps={{
                        input: {
                          size: 'small',
                          startAdornment: (
                            <InputAdornment position="start" sx={{ marginRight: '2px' }}>
                              <Icon icon={SearchIcon} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Box>
                </Box>

                <FormGroup sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                  {displayedComponents.map((option) => (
                    <Paper
                      key={option.id}
                      elevation={0}
                      sx={getOptionPaperStyle(selectedComponents.includes(option.id))}>
                      <FormControlLabel
                        sx={{
                          margin: 0,
                          padding: 0.5,
                          width: '100%',
                          '& .MuiFormControlLabel-label': {
                            fontSize: '0.875rem',
                            width: 'calc(100% - 36px)',
                          },
                          ...checkboxStyles,
                        }}
                        control={
                          <Checkbox
                            checked={selectedComponents.includes(option.id)}
                            onChange={() => handleComponentChange(option.id)}
                            disabled={loading}
                            size="small"
                          />
                        }
                        label={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              gap: 0.5,
                              minWidth: 0,
                              width: '100%',
                            }}>
                            {option.blocklet && (
                              <BundleAvatar
                                size={20}
                                blocklet={option.blocklet}
                                ancestors={option.ancestors}
                                style={{ borderRadius: 4, flexShrink: 0 }}
                              />
                            )}
                            <Typography
                              noWrap
                              variant="body2"
                              component="span"
                              title={option.label}
                              sx={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '100%',
                              }}>
                              {option.label}
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                  ))}
                </FormGroup>

                {filteredComponents.length > COMPONENTS_PER_PAGE && searchTerm.trim() === '' && (
                  <Button
                    fullWidth
                    size="small"
                    onClick={handleExpandToggle}
                    sx={{ mt: 1 }}
                    endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  />
                )}
              </Box>
            </Box>
          </Popover>
        </Box>
      </Box>
      {selectedComponents.length > 0 || selectedSeverities.length > 0 ? (
        <Box
          className="notification-filter-content"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mt: 2,
          }}>
          {/* 已选中的严重程度 */}
          {selectedSeverities.map((severityValue) => {
            const severityOption = severityOptions.find((option) => option.value === severityValue);
            return (
              <Chip
                key={`severity-${severityValue}`}
                label={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}>
                    <SeverityDot severity={severityValue} />
                    {severityOption ? severityOption.label : severityValue}
                  </Box>
                }
                onDelete={() => handleSeverityChange(severityValue)}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  color: 'text.secondary',
                  borderColor: 'divider',
                  '& .MuiChip-label': {
                    display: 'flex',
                    alignItems: 'center',
                  },
                }}
              />
            );
          })}
          {/* 已选中的组件 */}
          {selectedComponents.map((componentId) => {
            const componentOption = componentOptions.find((option) => option.id === componentId);
            return (
              <Chip
                key={`component-${componentId}`}
                label={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}>
                    {componentOption?.blocklet && (
                      <BundleAvatar
                        size={16}
                        blocklet={componentOption.blocklet}
                        ancestors={componentOption.ancestors}
                        style={{ borderRadius: 4, flexShrink: 0 }}
                      />
                    )}
                    {componentOption ? componentOption.label : componentId}
                  </Box>
                }
                variant="outlined"
                onDelete={() => handleComponentChange(componentId)}
                size="small"
                sx={{
                  borderRadius: 2,
                  color: 'text.secondary',
                  borderColor: 'divider',
                  '& .MuiChip-label': {
                    display: 'flex',
                    alignItems: 'center',
                  },
                }}
              />
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
}
