import PropTypes from 'prop-types';
import useSetState from 'react-use/lib/useSetState';

import Dialog from '@arcblock/ux/lib/Dialog';
import Spinner from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useSessionContext } from '@abtnode/ux/lib/contexts/session';
import Button from '@arcblock/ux/lib/Button';
import { joinURL, withQuery } from 'ufo';
import { installBlockletTitleSchema, installBlockletDescriptionSchema } from '@blocklet/meta/lib/schema';

import { useNodeContext } from '../../contexts/node';
import { getWebWalletUrl } from '../../libs/util';

export default function CreateBlocklet({ onCancel, onSuccess }) {
  const { info } = useNodeContext();
  const { t } = useLocaleContext();
  const { api } = useSessionContext();

  const [state, setState] = useSetState({
    loading: false,
    title: '',
    titleError: '',
    description: '',
    descriptionError: '',
    isConnectOpen: false,
  });

  const validations = {
    title: v =>
      installBlockletTitleSchema
        .messages({
          '*': t('blocklet.titleValidationError'),
        })
        .validate(v)?.error?.message || '',
    description: v =>
      installBlockletDescriptionSchema
        .messages({
          '*': t('blocklet.descriptionValidationError'),
        })
        .validate(v)?.error?.message || '',
  };

  const onStartInstall = () => {
    // FIXME: 统一 blocklet 的启动流程，这里重定向到 server 的 launcher 页面
    const launcherUrl = joinURL(window?.env?.apiPrefix ?? '/', '/launch-blocklet/install');
    window.location.href = withQuery(launcherUrl, {
      from: 'empty',
      title: state.title,
      description: state.description,
    });
    // setState({ loading: true, isConnectOpen: true });
  };

  const onEndInstall = result => {
    setState({ loading: false, isConnectOpen: false });
    onSuccess(result);
  };

  const onCancelInstall = () => {
    setState({ loading: false, isConnectOpen: false });
  };

  const onBlur = e => {
    const { value, name } = e.target;
    setState({ [`${name}Error`]: value ? validations[name](value) : '' });
  };

  const onChange = e => {
    const { value, name } = e.target;
    const errorKey = `${name}Error`;
    if (state[errorKey]) {
      setState({
        [name]: value,
        [errorKey]: value ? validations[name](value) : '',
      });
    } else {
      setState({ [name]: value });
    }
  };

  return (
    <>
      <Dialog
        title={t('blocklet.installFromCreate')}
        fullWidth
        maxWidth="sm"
        onClose={() => onCancel()}
        showCloseButton
        open
        actions={
          <>
            <Button
              onClick={e => {
                e.stopPropagation();
                onCancel();
              }}
              color="inherit">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={e => {
                e.stopPropagation();
                onStartInstall();
              }}
              color="primary"
              data-cy="install-blocklet-next-step"
              variant="contained"
              disabled={
                state.loading || state.titleError || state.descriptionError || !state.title || !state.description
              }
              style={{ marginLeft: 8 }}>
              {state.loading && <Spinner size={16} />}
              {t('common.create')}
            </Button>
          </>
        }>
        <DialogContentText component="div">
          <Typography component="div">
            <TextField
              style={{ marginBottom: 24 }}
              label={`Blocklet ${t('common.title')}`}
              autoComplete="off"
              variant="outlined"
              fullWidth
              autoFocus
              name="title"
              value={state.title}
              onBlur={onBlur}
              onChange={onChange}
              error={!!state.titleError}
              helperText={state.titleError}
              disabled={state.loading}
            />
            <TextField
              label={`Blocklet ${t('common.description')}`}
              autoComplete="off"
              variant="outlined"
              fullWidth
              name="description"
              value={state.description}
              onBlur={onBlur}
              onChange={onChange}
              error={!!state.descriptionError}
              helperText={state.descriptionError}
              disabled={state.loading}
            />
          </Typography>
        </DialogContentText>
      </Dialog>
      <DidConnect
        popup
        open={state.isConnectOpen}
        forceConnected={false}
        className="launch-from-create-auth"
        action="launch-free-blocklet-by-session"
        checkFn={api.get}
        checkTimeout={5 * 60 * 1000}
        webWalletUrl={getWebWalletUrl(info)}
        onSuccess={onEndInstall}
        extraParams={{ title: state.title, description: state.description }}
        messages={{
          title: t('setup.keyPair.title'),
          scan: t('setup.keyPair.scan'),
          confirm: t('setup.keyPair.confirm'),
          success: t('setup.keyPair.success'),
        }}
        onClose={onCancelInstall}
      />
    </>
  );
}

CreateBlocklet.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
