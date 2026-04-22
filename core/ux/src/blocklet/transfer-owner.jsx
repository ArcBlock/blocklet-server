/* eslint-disable react/no-unstable-nested-components */
import { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import Dialog from '@arcblock/ux/lib/Dialog';
import Spinner from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Connect from '@arcblock/did-connect-react/lib/Connect';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import ClickToCopy from '../click-to-copy';
import { formatError, getTransferAppLink, formatToDatetime } from '../util';
import { SessionContext } from '../contexts/session';
import { useTeamContext } from '../contexts/team';

export default function TransferOwner({ onCancel, onSuccess, onError = () => {} }) {
  const { api: sessionAPI } = useContext(SessionContext);
  const [loading, setLoading] = useState(false);
  const { t, locale } = useLocaleContext();
  const [error, setError] = useState('');
  const [openTransferOwner, setOpenTransferOwner] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState('');
  const { endpoint } = useTeamContext();
  const [confirmCopied, setConfirmCopied] = useState(false);

  const onCreateSession = (res) => {
    setError(null);
    setLoading(true);

    try {
      setResult(res.result);
      // eslint-disable-next-line no-use-before-define
      setActiveStep(steps.length - 1); // 跳转到最后一步
    } catch (err) {
      const errMsg = formatError(err);
      setError(errMsg);
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwner = () => {
    setOpenTransferOwner(true);
    setActiveStep(1);
  };

  const handleCancelTransferOwner = () => {
    setOpenTransferOwner(false);
    setActiveStep(0);
  };

  const steps = [
    {
      body: (
        <Box>
          <Typography>{t('team.transferApp.transferDialog.tips.progress')}</Typography>
          <Typography
            sx={{
              mt: 3,
              mb: 2,
            }}>
            {t('team.transferApp.transferDialog.tips.newOwnerPermissions')}
          </Typography>
        </Box>
      ),
      cancel: t('common.cancel'),
      confirm: t('team.transferApp.transferDialog.createTransferLink'),
      onCancel,
      onConfirm: handleTransferOwner,
    },
    {
      cancel: t('common.cancel'),
      confirm: t('team.transferApp.transferDialog.createTransferLink'),
      body: () => {
        return (
          <Connect
            action="transfer-app-owner"
            open={openTransferOwner}
            locale={locale}
            checkFn={sessionAPI.get}
            onClose={handleCancelTransferOwner}
            onSuccess={onCreateSession}
            checkTimeout={5 * 60 * 1000}
            extraParams={{}}
            messages={{
              title: t('team.transferApp.connectDialog.title'),
              scan: t('team.transferApp.connectDialog.scan'),
              confirm: t('team.transferApp.connectDialog.confirm'),
              success: t('team.transferApp.connectDialog.success'),
            }}
            popup
          />
        );
      },
    },
    {
      body: () => {
        const link = getTransferAppLink({
          transferId: result.transferId,
          endpoint,
        });
        return (
          <>
            <Box
              // eslint-disable-next-line no-use-before-define
              component={Bold}
              dangerouslySetInnerHTML={{
                __html: t('team.transferApp.transferDialog.createSuccessTip1'),
              }}
            />
            <Box
              // eslint-disable-next-line no-use-before-define
              component={Bold}
              sx={{
                mt: 2,
              }}>
              <Bold>{t('team.transferApp.transferDialog.createSuccessTip3')}</Bold>
            </Box>
            <Box>
              <Box
                // eslint-disable-next-line no-use-before-define
                component={Bold}
                sx={{
                  mt: 2,
                }}>
                <Bold>
                  {t('team.transferApp.transferDialog.createSuccessTip2', {
                    expireDate: formatToDatetime(result.expireDate, locale),
                  })}
                </Bold>
              </Box>
              <Box
                sx={{
                  my: 1,
                }}>
                <ClickToCopy>{link}</ClickToCopy>
              </Box>
            </Box>
            <div>
              <FormControlLabel
                value="end"
                control={<Checkbox checked={confirmCopied} onChange={(e) => setConfirmCopied(e.target.checked)} />}
                label={t('team.transferApp.transferDialog.iKnow')}
                labelPlacement="end"
              />
            </div>
          </>
        );
      },
      confirm: t('common.confirm'),
      onConfirm: onSuccess,
    },
  ];
  const step = steps[activeStep];

  return (
    <Dialog
      title={<Bold className="title">{t('team.transferApp.transferDialog.title')}</Bold>}
      fullWidth
      open
      showCloseButton={false}
      actions={
        <>
          {step.cancel && (
            <Button onClick={step.onCancel} color="inherit">
              {step.cancel}
            </Button>
          )}
          <Button
            onClick={step.onConfirm}
            color="error"
            disabled={loading || (activeStep === steps.length - 1 && !confirmCopied)}
            variant="contained"
            autoFocus>
            {loading && <Spinner size={16} />}
            {step.confirm}
          </Button>
        </>
      }>
      <DialogContentText component="div">{typeof step.body === 'function' ? step.body() : step.body}</DialogContentText>
      {!!error && (
        <Alert severity="error" variant="icon">
          {error}
        </Alert>
      )}
    </Dialog>
  );
}

TransferOwner.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
};

const Bold = styled.div`
  font-size: 16px;
  font-weight: bold;
  &.title {
    font-size: 20px;
  }
`;
