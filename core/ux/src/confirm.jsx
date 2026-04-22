import { useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import {
  useTheme,
  useMediaQuery,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
} from '@mui/material';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';

import { formatError } from './util';
import useMobileWidth from './hooks/mobile-width';

export default function ConfirmDialog({
  title,
  description,
  showCancel = true,
  showConfirm = true,
  cancel = '',
  confirm = 'Confirm',
  color = 'error',
  params: initialParams = {},
  onCancel = () => {},
  onConfirm,
  loading: inputLoading = false,
  displayError = true,
  children = undefined,
  ...rest
}) {
  const [params, setParams] = useState(initialParams);
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t: changeLocale } = useLocaleContext();
  const theme = useTheme();

  const onCallback = async (cb) => {
    if (typeof cb === 'function') {
      setLoading(true);
      try {
        const res = await cb(params);
        if (res === false) {
          return;
        }
        setOpen(false);
      } catch (err) {
        setError(formatError(err));
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setOpen(false);
    }
  };

  const t = typeof title === 'function' ? title() : title;
  const d = typeof description === 'function' ? description(params, setParams, setError) : description;

  const isBreakpointsDownSm = useMediaQuery(theme.breakpoints.down('md'));

  const handleClick = (e) => {
    e.stopPropagation();
  };
  const { minWidth } = useMobileWidth();

  return (
    <StyledDialog onClick={handleClick} fullScreen={isBreakpointsDownSm} open={open} style={{ minWidth }} {...rest}>
      <DialogTitle>{t}</DialogTitle>
      <DialogContent style={{ minWidth }}>
        <DialogContentText component="div">{d}</DialogContentText>
        {!!error && displayError && (
          <Alert severity="error" style={{ width: '100%', marginTop: 8 }}>
            {error}
          </Alert>
        )}
        {children}
      </DialogContent>
      <DialogActions className="delete-actions" style={{ padding: '8px 24px 24px' }}>
        {showCancel && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onCallback(onCancel);
            }}
            color="inherit"
            data-cy="cancel-confirm-dialog">
            {cancel || changeLocale('common.cancel')}
          </Button>
        )}
        {showConfirm && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onCallback(onConfirm);
            }}
            color={color}
            // eslint-disable-next-line no-underscore-dangle
            disabled={params.__disableConfirm || loading || inputLoading}
            variant="contained"
            data-cy="submit-confirm-dialog"
            autoFocus>
            {(loading || inputLoading) && <CircularProgress size={16} sx={{ mr: 1 }} />}
            {confirm}
          </Button>
        )}
      </DialogActions>
    </StyledDialog>
  );
}

ConfirmDialog.propTypes = {
  title: PropTypes.any.isRequired,
  description: PropTypes.any.isRequired, // can be a function that renders different content based on params
  showCancel: PropTypes.bool,
  showConfirm: PropTypes.bool,
  cancel: PropTypes.string,
  color: PropTypes.string,
  confirm: PropTypes.string,
  params: PropTypes.object, // This object holds states managed in the dialog
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  displayError: PropTypes.bool,
  children: PropTypes.any,
};

const StyledDialog = styled(Dialog)`
  .delete-actions .Mui-disabled {
    color: ${({ theme }) => `${theme.palette.text.primary} !important`};
    box-shadow: none;
    background-color: ${({ theme }) => `${theme.palette.action.disabled} !important`};
  }
`;
