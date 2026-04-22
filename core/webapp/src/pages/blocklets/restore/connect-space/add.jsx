import Button from '@arcblock/ux/lib/Button';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { CircularProgress, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import DialogContentText from '@mui/material/DialogContentText';
import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';
import { formatError } from '@blocklet/error';
import toast from '@arcblock/ux/lib/Toast';
import { joinURL } from 'ufo';
import { isValidSpaceGatewayUrl, getSpaceGatewayUrl } from '@abtnode/ux/lib/util/spaces';
import api from '../../../../libs/api';

/**
 * @typedef {import('./selector').SpaceGateway} SpaceGateway
 */

/**
 *
 *
 * @export
 * @param {{
 *  onAddGateway: (spaceGateway: SpaceGateway) => Promise<void> | void,
 * }} { onAddGateway, ...rest }
 * @return {React.Component}
 */
function SpaceGatewayAdd({ onAddGateway = () => undefined, ...rest }) {
  const { t, locale } = useLocaleContext();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onConfirm = async () => {
    try {
      setLoading(true);

      const spaceGatewayUrl = await getSpaceGatewayUrl(url, { withSearchParams: false });

      if (!(await isValidSpaceGatewayUrl(spaceGatewayUrl))) {
        throw new Error(t('storage.spaces.gateway.add.invalidUrl'));
      }

      const { data } = await api.get(joinURL(new URL(spaceGatewayUrl).origin, '/__blocklet__.js?type=json'));

      /** @type {SpaceGateway} */
      const spaceGateway = {
        name: data.appName,
        url: spaceGatewayUrl,
        protected: false,
      };

      await onAddGateway(spaceGateway);

      toast.success(t('storage.spaces.addedWithName', { name: spaceGateway.name }));
      setOpen(false);
    } catch (err) {
      setErrorMessage(`${t('storage.spaces.gateway.add.failed', locale)}: ${formatError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="middle" color="primary" variant="outlined" onClick={() => setOpen(true)} {...rest}>
        {t('storage.spaces.gateway.add.title')}
      </Button>
      <Dialog
        title={t('storage.spaces.gateway.add.title')}
        fullWidth
        maxWidth="md"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ style: { minHeight: 'auto' } }}
        actions={
          <>
            <Button
              onClick={e => {
                e.stopPropagation();
                setOpen(false);
              }}
              color="inherit">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={e => {
                e.stopPropagation();
                onConfirm();
              }}
              color="primary"
              data-cy="install-blocklet-next-step"
              disabled={loading || !url}
              variant="contained"
              autoFocus>
              {loading && <CircularProgress size={16} />}
              {t('common.confirm')}
            </Button>
          </>
        }>
        <div style={{ paddingTop: 12, overflowY: 'hidden' }}>
          <DialogContentText component="div">
            <Typography component="div">
              <TextField
                label={t('storage.spaces.gateway.add.label')}
                autoComplete="off"
                variant="outlined"
                name="url"
                fullWidth
                value={url}
                onChange={e => {
                  setErrorMessage(null);
                  setUrl(e.target.value);
                }}
                disabled={loading}
                onKeyPress={async e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    await onConfirm();
                  }
                }}
                autoFocus
              />
            </Typography>
          </DialogContentText>
        </div>
        {!!errorMessage && (
          <Alert severity="error" style={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        )}
      </Dialog>
    </>
  );
}

SpaceGatewayAdd.propTypes = {
  onAddGateway: PropTypes.func,
};

export default SpaceGatewayAdd;
