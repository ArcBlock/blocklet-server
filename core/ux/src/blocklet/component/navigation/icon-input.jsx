/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { Box, Button, CircularProgress, IconButton, InputAdornment, Popover, TextField, Tooltip } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import BlockletIcon from '@blocklet/ui-react/lib/Icon';
import { lazy, Suspense, useRef, useState, useEffect } from 'react';
import { useAsyncEffect, useDebounceFn, useMemoizedFn, useReactive } from 'ahooks';
import { Icon, loadIcon } from '@iconify/react';
import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { styled } from '@arcblock/ux/lib/Theme';
import { joinURL } from 'ufo';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';
import { searchIcons, fetchIconsByCollection, getIconPreviewUrl, useIconifyId } from './icon-query';
import { blobToFile, fetchSvgAsPng } from '../../../util';

// eslint-disable-next-line import/no-unresolved
const UploaderComponent = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

const StyledBlockletIcon = styled(BlockletIcon)(({ theme }) => ({
  '&&': {
    color: theme.palette.text.primary,
  },
  '> img': {
    filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
  },
}));

function IconifyIcon({ icon, ...rest }) {
  const [loaded, setLoaded] = useState(false);
  useAsyncEffect(async () => {
    setLoaded(false);
    await loadIcon(icon);
    setLoaded(true);
  }, [icon]);
  if (icon) {
    if (loaded) {
      return <Icon icon={icon} {...rest} />;
    }
    return <Icon color="#f06f6e" icon="ic:baseline-error" {...rest} />;
  }
  return <Icon icon="material-symbols-light:select-rounded" {...rest} />;
}

IconifyIcon.propTypes = {
  icon: PropTypes.string.isRequired,
};

// TODO: 将来移到 ux 中
export default function IconInput({
  value,
  helperText,
  label,
  placeholder,
  methods = ['select'],
  iconifyShape = 'id',
  ...rest
}) {
  const { getSessionInHeader, prefix, inService } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const customUrl = blocklet.environments.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL);
  const headers = getSessionInHeader();
  const uploaderRef = useRef(null);
  const manualUploaderRef = useRef(null);
  const inputRef = useRef(null);
  const { t, locale } = useLocaleContext();
  const { isIconId, iconId } = useIconifyId(value);
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);

  const { onChange, onBlur, sx, ...restProps } = rest;
  const canUseUpload = methods.includes('upload');
  const canUseSelect = methods.includes('select');
  const apiPath = joinURL(prefix, '/api/media/upload', blocklet.appPid);

  const currentState = useReactive({
    showPopover: false,
  });

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

  // js 上传 iconify icon
  const uploadIcon = useMemoizedFn(async (blobFile) => {
    const uploader = uploaderRef.current.getUploader();

    const result = await uploader.uploadFile(blobFile);

    return result;
  });

  const handleClose = useMemoizedFn(() => {
    setSearchAnchorEl(null);
  });

  const handleClick = useMemoizedFn(() => {
    if (canUseSelect) {
      setSearchAnchorEl(inputRef.current);
    }
  });

  const handlePick = useMemoizedFn(async (id) => {
    try {
      if (iconifyShape === 'url') {
        // 静默上传 iconify icon
        const url = getIconPreviewUrl(id);
        const blob = await fetchSvgAsPng(url, { width: 128, height: 128 });
        const file = await blobToFile(blob, id);
        await uploadIcon(file);
      } else {
        onChange?.(id);
      }
    } catch (error) {
      console.error('Failed to pick icon:', error);
    }

    handleClose();
  });

  const handleClickUpload = useMemoizedFn((e) => {
    e.stopPropagation();
    manualUploaderRef.current.open();
    handleClose();
  });

  const handleUploadFinish = useMemoizedFn((result) => {
    // 上传成功的回调
    rest?.onChange?.(result.data.url);
  });

  return (
    <>
      <TextField
        helperText={helperText}
        value={value}
        sx={{ '& .MuiInputBase-root,.MuiInputBase-input': { cursor: 'pointer' }, ...sx }}
        onClick={canUseSelect ? handleClick : undefined}
        {...restProps}
        label={label}
        placeholder={placeholder}
        slotProps={{
          input: {
            ref: inputRef,
            readOnly: true,
            startAdornment: (
              <InputAdornment
                position="start"
                sx={{ cursor: 'auto' }}
                onMouseEnter={() => {
                  if (value) currentState.showPopover = true;
                }}
                onMouseLeave={() => {
                  currentState.showPopover = false;
                }}>
                <StyledBlockletIcon size={28} icon={withDomain(value)} alt="Error" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {/* 清除按钮 */}
                <IconButton
                  sx={{ visibility: value ? 'visible' : 'hidden' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                  }}>
                  <ClearIcon style={{ fontSize: 18 }} />
                </IconButton>
                {/* 上传按钮 */}
                {canUseUpload && (
                  <Tooltip title={t('common.upload')}>
                    <IconButton disableFocusRipple={false} disableRipple={false} onClick={handleClickUpload}>
                      <IconifyIcon icon="material-symbols:upload-file-outline-rounded" width={24} height={24} />
                    </IconButton>
                  </Tooltip>
                )}
                {/* 下拉箭头 */}
                {canUseSelect && (
                  <Box
                    component={ArrowDropDownIcon}
                    sx={{
                      mr: '-6px',
                      fontSize: 24,
                      transform: searchAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 200ms',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </InputAdornment>
            ),
          },
        }}
      />
      {/* 选择图标 */}
      {canUseSelect && (
        <Popover
          open={!!searchAnchorEl}
          anchorEl={searchAnchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          slotProps={{
            paper: {
              style: {
                // 移动端全屏显示
                ...(isMobile && {
                  width: '100vw',
                  height: '100vh',
                  boxShadow: 'none',
                }),
              },
            },
          }}
          onClose={handleClose}>
          <IconPicker
            label={label}
            placeholder={placeholder}
            value={isIconId ? iconId : ''}
            sx={{ width: inputRef.current?.offsetWidth ?? 'auto' }}
            onPick={handlePick}
            onClose={handleClose}
          />
        </Popover>
      )}
      {/* 自动上传 */}
      <Uploader
        ref={uploaderRef}
        locale={locale}
        apiPath={apiPath}
        headers={headers}
        imageEditorProps={{}} // 去掉校验
        onUploadFinish={handleUploadFinish}
      />
      {/* 手动上传 */}
      <Uploader
        ref={manualUploaderRef}
        locale={locale}
        apiPath={apiPath}
        headers={headers}
        onUploadFinish={handleUploadFinish}
      />
      {/* 图片预览 */}
      <Popover
        sx={{ pointerEvents: 'none' }}
        open={currentState.showPopover}
        anchorEl={inputRef.current}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        onClose={() => {
          currentState.showPopover = false;
        }}
        disableRestoreFocus>
        <StyledBlockletIcon size={120} icon={withDomain(value)} alt="Error" />
      </Popover>
    </>
  );
}

IconInput.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.any,
  placeholder: PropTypes.any,
  helperText: PropTypes.string,
  methods: PropTypes.arrayOf(PropTypes.oneOf(['select', 'upload'])),
  iconifyShape: PropTypes.oneOf(['id', 'url']),
};

// icon picker
function IconPicker({ label, placeholder, value = '', sx, onPick, onClose, ...rest }) {
  const [displayedIcons, setDisplayedIcons] = useState([]); // 存储当前显示的图标
  const [loading, setLoading] = useState(true);
  const [innerValue, setInnerValue] = useState(value);
  const [noResults, setNoResults] = useState(false); // 无结果状态
  const contentRef = useRef(null);
  const allIconsRef = useRef([]); // 存储所有图标
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true); // 是否有更多图标
  const { t } = useLocaleContext();
  const PAGE_SIZE = 96; // 每页显示96个图标

  // 处滚动加载
  const loadMoreIcons = useMemoizedFn(() => {
    if (!hasMoreRef.current || loading) return;

    setLoading(true);

    // 模拟异步加载，给UI一个反馈时间
    setTimeout(() => {
      const nextPage = pageRef.current + 1;
      const startIndex = (nextPage - 1) * PAGE_SIZE;
      const endIndex = nextPage * PAGE_SIZE;

      // 加载下一页图标
      const nextIcons = allIconsRef.current.slice(startIndex, endIndex);
      setDisplayedIcons((prev) => [...prev, ...nextIcons]);

      // 更新页码
      pageRef.current = nextPage;

      // 检查是否还有更多图标
      hasMoreRef.current = endIndex < allIconsRef.current.length;

      setLoading(false);
    }, 300);
  });

  // 设置所有图标
  const handleIconsResult = useMemoizedFn((icons) => {
    // 重置状态
    allIconsRef.current = icons;
    pageRef.current = 1;
    hasMoreRef.current = icons.length > PAGE_SIZE;

    // 设置第一页图标
    const firstPageIcons = icons.slice(0, PAGE_SIZE);
    setDisplayedIcons(firstPageIcons);

    // 设置无结果状态
    setNoResults(icons.length === 0);

    // 如果有更多图标，自动加载下一页
    if (hasMoreRef.current) {
      loadMoreIcons();
    }
  });

  // 搜索
  const { run: search } = useDebounceFn(
    async (keyword) => {
      if (!keyword) {
        return;
      }

      setLoading(true);
      try {
        const { icons: results } = await searchIcons({ keyword });
        handleIconsResult(results);
      } catch (error) {
        console.error('Failed to search icons:', error);
        setNoResults(true);
      } finally {
        setLoading(false);
      }
    },
    {
      wait: 300,
      trailing: true,
    }
  );

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;

      if (scrollTop + clientHeight >= scrollHeight - 150 || scrollHeight <= clientHeight) {
        loadMoreIcons();
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      // 初始检查，如果内容不足以滚动，则加载更多
      handleScroll();
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loadMoreIcons, loading]);

  // 初始化
  useAsyncEffect(async () => {
    if (innerValue) {
      search(innerValue);
    } else {
      // 默认图标
      setLoading(true);
      try {
        const defaultIcons = await fetchIconsByCollection('mdi-light');
        handleIconsResult(defaultIcons);
      } catch (error) {
        console.error('Failed to fetch default icons:', error);
        setNoResults(true);
      } finally {
        setLoading(false);
      }
    }
  }, [innerValue, search, handleIconsResult]);

  return (
    <IconPickerRoot ref={contentRef} sx={sx} {...rest}>
      <Box className="icon-picker-input">
        <TextField
          label={t('navigation.form.searchIcons')}
          placeholder={t('navigation.form.searchIconsPlaceholder')}
          size="small"
          value={innerValue}
          sx={{ flexGrow: 1 }}
          autoFocus
          onChange={(e) => setInnerValue(e.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <IconButton sx={{ visibility: innerValue ? 'visible' : 'hidden' }} onClick={() => setInnerValue('')}>
                  <ClearIcon style={{ fontSize: 18 }} />
                </IconButton>
              ),
            },
          }}
        />
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </Box>
      <Box>
        {/* 图标网格 */}
        {displayedIcons.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(32px, auto))',
              gridAutoRows: 'min-content',
              alignItems: 'center',
              gap: 1,
              p: 2,
            }}>
            {displayedIcons.map((iconId) => (
              <StyledIconButton
                key={iconId}
                $active={value === iconId}
                onClick={() => {
                  onPick(iconId);
                }}>
                <Icon icon={iconId} width="32" height="32" />
              </StyledIconButton>
            ))}
          </Box>
        )}

        {/* 无结果提示 */}
        {noResults && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Box sx={{ textAlign: 'center' }}>No matching results</Box>
          </Box>
        )}

        {/* 加载指示器 - 始终在底部显示 */}
        {loading && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={20} />
          </Box>
        )}
      </Box>
    </IconPickerRoot>
  );
}

IconPicker.propTypes = {
  label: PropTypes.any,
  placeholder: PropTypes.any,
  value: PropTypes.string,
  sx: PropTypes.object,
  onPick: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const IconPickerRoot = styled(Box)(({ theme }) => ({
  minWidth: '100%',
  height: '100%',
  padding: 0,
  overflow: 'auto',
  [theme.breakpoints.up('md')]: {
    minWidth: '480px',
    maxHeight: '400px',
    padding: theme.spacing(1),
    paddingTop: 0,

    '.icon-picker-input': {
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(1),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
  },
  '.icon-picker-input': {
    position: 'sticky',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    top: 0,
    zIndex: 1,
    backgroundColor: theme.palette.background.paper,
  },
}));

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== '$active',
})(({ $active, theme }) => ({
  boxSizing: 'content-box',
  backgroundColor: $active ? theme.palette.action.hover : 'transparent',
  borderRadius: 4,
  padding: 1,
  width: 32,
  height: 32,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

/** 上传组件 */
function Uploader({
  ref = null,
  locale,
  apiPath,
  headers,

  imageEditorProps = {
    actions: {
      revert: true,
      rotate: true,
      granularRotate: true,
      flip: true,
      zoomIn: true,
      zoomOut: true,
      cropSquare: false,
      cropWidescreen: false,
      cropWidescreenVertical: false,
    },
    cropperOptions: {
      autoCrop: true,
      autoCropArea: 1,
      aspectRatio: 1,
      initialAspectRatio: 1,
      croppedCanvasOptions: {
        minWidth: 120,
        minHeight: 120,
      },
    },
  },

  onUploadFinish,
}) {
  return (
    <Suspense>
      <UploaderComponent
        locale={locale}
        ref={ref}
        popup
        installerProps={{ disabled: true }}
        plugins={['ImageEditor']}
        onUploadFinish={(result) => onUploadFinish?.(result)}
        coreProps={{
          restrictions: {
            allowedFileTypes: ['image/*'],
            maxFileSize: 1024 * 1024 * 1,
            maxNumberOfFiles: 1,
          },
        }}
        dashboardProps={{
          autoOpen: 'imageEditor',
        }}
        imageEditorProps={imageEditorProps}
        apiPathProps={{
          uploader: apiPath,
          disableMediaKitPrefix: true, // 不自动拼接 media kit 的前缀
          disableAutoPrefix: true,
          disableMediaKitStatus: true,
        }}
        tusProps={{
          headers,
        }}
      />
    </Suspense>
  );
}

Uploader.propTypes = {
  ref: PropTypes.any,
  locale: PropTypes.string,
  apiPath: PropTypes.string,
  headers: PropTypes.object,
  imageEditorProps: PropTypes.object,
  onUploadFinish: PropTypes.func,
};
