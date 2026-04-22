import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { createContext, isValidElement, useContext, useMemo, useRef, useState } from 'react';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import PropTypes from 'prop-types';

export function Confirm({
  open = false,
  title = undefined,
  description = undefined,
  handleOk = undefined,
  handleCancel = undefined,
  okText = undefined,
  okButtonProps = undefined,
  cancelText = undefined,
  cancelButtonProps = undefined,
  actions = undefined,
  ...rest
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useLocaleContext();

  const renderDesc = () => {
    if (isValidElement(description)) return description;
    return <DialogContentText>{description}</DialogContentText>;
  };

  const renderActions = useMemo(() => {
    const baseActions = [
      <Button key="cancel" color="inherit" variant="text" onClick={handleCancel} {...cancelButtonProps}>
        {cancelText || t('common.cancel') || 'Cancel'}
      </Button>,
      <Button key="ok" color="primary" variant="contained" onClick={handleOk} {...okButtonProps}>
        {okText || t('common.confirm') || 'Yes'}
      </Button>,
    ];
    return actions ? actions(baseActions, handleCancel) : baseActions;
  }, [t, okText, cancelText, okButtonProps, cancelButtonProps, actions, handleCancel, handleOk]);

  if (!open) return null;

  return (
    <Dialog fullScreen={fullScreen} onClose={handleCancel} maxWidth="md" {...rest} open={open}>
      {title && <DialogTitle variant="h4">{title}</DialogTitle>}
      <DialogContent sx={{ minWidth: { xs: 'initial', md: 400 } }}>{renderDesc()}</DialogContent>
      <DialogActions>{renderActions}</DialogActions>
    </Dialog>
  );
}

Confirm.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  handleOk: PropTypes.func,
  handleCancel: PropTypes.func,
  okText: PropTypes.string,
  okButtonProps: PropTypes.object,
  cancelText: PropTypes.string,
  cancelButtonProps: PropTypes.object,
  actions: PropTypes.func,
};

export const ConfirmContext = createContext({});

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children = null }) {
  const [open, setOpen] = useState(false);
  const [currentOptions, setCurrentOptions] = useState({});
  const resolver = useRef(undefined);

  const handleOk = () => {
    resolver.current?.(true);
    setOpen(false);
  };

  const handleCancel = () => {
    resolver.current?.(false);
    setOpen(false);
  };

  const confirm = (options) => {
    setCurrentOptions(options);
    setOpen(true);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  };

  const value = useMemo(() => ({ open, confirm }), [open]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Confirm
        {...(currentOptions.dialogProps || {})}
        open={open}
        onClose={handleCancel}
        title={currentOptions.title}
        description={currentOptions.description}
        okText={currentOptions.okText}
        okButtonProps={currentOptions.okButtonProps}
        cancelText={currentOptions.cancelText}
        cancelButtonProps={currentOptions.cancelButtonProps}
        handleOk={handleOk}
        handleCancel={handleCancel}
        actions={currentOptions.actions}
      />
    </ConfirmContext.Provider>
  );
}

ConfirmProvider.propTypes = {
  children: PropTypes.node,
};
