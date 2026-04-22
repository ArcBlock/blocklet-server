import PropTypes from 'prop-types';
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useCreation, useMemoizedFn, useReactive } from 'ahooks';
import noop from 'lodash/noop';
import isUrl from 'is-url';
import { Icon } from '@iconify/react';
import SwitchWithLabel from '@abtnode/ux/lib/switch';
import Tooltip from '@abtnode/ux/lib/tooltip';
import CloseRoundedIcon from '@iconify-icons/material-symbols/close-rounded';
import CheckIcon from '@iconify-icons/material-symbols/check';
import SendRoundedIcon from '@iconify-icons/material-symbols/send-rounded';
import EditSquareOutlineRoundedIcon from '@iconify-icons/material-symbols/edit-square-outline-rounded';
import DeleteOutlineRoundedIcon from '@iconify-icons/material-symbols/delete-outline-rounded';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { isSlackWebhookUrl } from '@abtnode/ux/lib/util';

function WebhookItemPreview({ type, url, enabled, onEdit, onChange, onDelete }) {
  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1,
        px: 1.5,
        gap: 0.75,
        borderRadius: 1,
        '& .hover-actions': {
          opacity: 0,
          transition: 'opacity 0.2s',
        },
        '&:hover': {
          backgroundColor: 'action.hover',
          '& .hover-actions': {
            opacity: 1,
          },
        },
      }}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0, cursor: 'pointer' }}
        onClick={onEdit}>
        <Tooltip title={type}>
          <Icon icon={type === 'slack' ? 'logos:slack-icon' : 'material-symbols:link-rounded'} />
        </Tooltip>
        <Typography
          sx={{
            color: 'text.primary',
            fontSize: 14,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
          {url}
        </Typography>
      </Box>
      <Box
        sx={{ minWidth: 72, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
        <IconButton className="hover-actions" size="small" onClick={onEdit} sx={{ p: 0 }}>
          <Icon icon={EditSquareOutlineRoundedIcon} />
        </IconButton>
        <IconButton color="error" onClick={onDelete} size="small" sx={{ p: 0 }}>
          <Icon icon={DeleteOutlineRoundedIcon} />
        </IconButton>
        <SwitchWithLabel checked={enabled} onChange={onChange} />
      </Box>
    </Box>
  );
}

WebhookItemPreview.propTypes = {
  type: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  enabled: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function WebhookItem({
  onTest = noop,
  onDelete = noop,
  onSave = noop,
  onCancel = noop,
  type = 'slack',
  url = '',
  enabled = true,
  edit = false,
  webhooks = [],
}) {
  const { t } = useLocaleContext();
  const currentState = useReactive({
    type: type || 'slack',
    url: url || '',
    edit: edit ?? false,
    enabled: enabled ?? true,
    error: '',
    loading: false,
  });

  const checkUrl = useMemoizedFn(() => {
    if (!currentState.url) {
      currentState.error = t('common.required');
      return false;
    }

    if (currentState.type === 'slack' && !isSlackWebhookUrl(currentState.url)) {
      currentState.error = t('common.invalid');
      return false;
    }

    if (!isUrl(currentState.url)) {
      currentState.error = t('common.invalid');
      return false;
    }

    // 检查重复：排除当前正在编辑的 webhook 自身
    const isDuplicate = webhooks.some((webhook) => {
      // 如果是编辑模式且 URL 没变，不算重复
      if (webhook.url === url && currentState.url === url) {
        return false;
      }
      return webhook.url === currentState.url;
    });

    if (isDuplicate) {
      currentState.error = t('common.duplicate');
      return false;
    }

    currentState.error = '';
    return true;
  });

  const handleClose = useMemoizedFn(() => {
    currentState.edit = false;
    currentState.url = url || '';
    currentState.type = type || 'slack';
    currentState.error = '';
    currentState.loading = false;
    onCancel();
  });

  const _onTest = useMemoizedFn(async (data) => {
    currentState.loading = true;
    await onTest(data);
    currentState.loading = false;
  });

  const onSubmit = useMemoizedFn((fn) => {
    return () => {
      if (checkUrl()) {
        fn({
          type: currentState.type,
          url: currentState.url,
          enabled: currentState.enabled,
        });
      }
    };
  });

  const inputAdornment = useCreation(() => {
    if (currentState.error) {
      return (
        <Typography component="span" color="error">
          {currentState.error}
        </Typography>
      );
    }

    if (currentState.edit) {
      if (currentState.loading) {
        return <CircularProgress size={16} />;
      }

      return (
        <IconButton
          size="small"
          onClick={onSubmit(_onTest)}
          sx={{
            mr: -1,
          }}>
          <Icon icon={SendRoundedIcon} />
        </IconButton>
      );
    }
    return null;
  }, [currentState.error, currentState.edit, currentState.loading]);

  if (!currentState.edit) {
    return (
      <WebhookItemPreview
        type={currentState.type}
        url={currentState.url}
        enabled={currentState.enabled}
        onEdit={() => {
          currentState.edit = true;
        }}
        onChange={(checked) => {
          currentState.enabled = checked;
          onSubmit((...args) => onSave(...args))();
        }}
        onDelete={() => {
          onDelete({
            type: currentState.type,
            url: currentState.url,
          });
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        px: 1.5,
        width: '100%',
        alignItems: {
          xs: 'flex-start',
          md: 'center',
        },
        flexDirection: {
          xs: 'column',
          md: 'row',
        },
      }}>
      <Select
        sx={{
          borderRadius: 1,
          '&.Mui-disabled': {
            backgroundColor: 'grey.50',
          },
        }}
        disabled={!currentState.edit || currentState.loading}
        size="small"
        value={currentState.type}
        onChange={(e) => {
          currentState.type = e.target.value;
        }}>
        <MenuItem value="api">{t('userCenter.webhook.url')}</MenuItem>
        <MenuItem value="slack">{t('userCenter.webhook.slack')}</MenuItem>
      </Select>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          width: '100%',
        }}>
        <TextField
          sx={{
            flex: 1,
            '.MuiInputBase-root': {
              borderRadius: 1,
              '&.Mui-disabled': {
                backgroundColor: 'grey.50',
              },
            },
          }}
          disabled={!currentState.edit || currentState.loading}
          fullWidth
          size="small"
          required
          value={currentState.url}
          onChange={(e) => {
            currentState.url = e.target.value;
            currentState.error = '';
            checkUrl();
          }}
          error={!!currentState.error}
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">{inputAdornment}</InputAdornment>,
            },
          }}
        />

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {currentState.edit ? (
            <>
              <IconButton
                color="success"
                onClick={onSubmit((...args) => {
                  onSave(...args);
                  currentState.edit = false;
                })}
                sx={{
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}>
                <Icon icon={CheckIcon} />
              </IconButton>
              <IconButton
                color="error"
                onClick={handleClose}
                sx={{
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}>
                <Icon icon={CloseRoundedIcon} />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton
                onClick={() => {
                  currentState.edit = true;
                }}
                sx={{
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}>
                <Icon icon={EditSquareOutlineRoundedIcon} />
              </IconButton>
              <IconButton
                color="error"
                onClick={() => {
                  onDelete({
                    type: currentState.type,
                    url: currentState.url,
                  });
                }}
                sx={{
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}>
                <Icon icon={DeleteOutlineRoundedIcon} />
              </IconButton>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

WebhookItem.propTypes = {
  onTest: PropTypes.func,
  onDelete: PropTypes.func,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  type: PropTypes.oneOf(['api', 'slack']),
  url: PropTypes.string,
  edit: PropTypes.bool,
  webhooks: PropTypes.array,
  enabled: PropTypes.bool,
};

export default WebhookItem;
