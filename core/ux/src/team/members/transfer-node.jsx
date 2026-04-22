/* eslint-disable react/no-unstable-nested-components */
import { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import useAsync from 'react-use/lib/useAsync';
import get from 'lodash/get';

import Dialog from '@arcblock/ux/lib/Dialog';
import Spinner from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

import Connect from '@arcblock/did-connect-react/lib/Connect';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import Alert from '@mui/material/Alert';

import ClickToCopy from '../../click-to-copy';
import { useNodeContext } from '../../contexts/node';
import { formatError, getInviteLink, formatToDatetime, getWebWalletUrl } from '../../util';
import { SessionContext } from '../../contexts/session';

export default function TransferMember({ teamDid, onCancel, onSuccess, onError = () => {}, endpoint = '' }) {
  const { api, info } = useNodeContext();
  const { api: sessionAPI } = useContext(SessionContext);
  const [loading, setLoading] = useState(false);
  const { t, locale } = useLocaleContext();
  const [error, setError] = useState('');
  const [openTransferNFTAuth, setOpenTransferNFTAuth] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [inviteInfo, setInviteInfo] = useState('');
  const [remark, setRemark] = useState('');

  const needTransferNFT = !!get(info, 'ownerNft.did');

  const delegationState = useAsync(async () => {
    if (needTransferNFT) {
      const { state } = await api.getDelegationState();
      return state;
    }

    return { delegated: true };
  });

  if (delegationState.loading) {
    return (
      <Dialog title={t('team.transferNode.inviteDialog.title')} fullWidth open onClose={onCancel}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Spinner />
        </div>
      </Dialog>
    );
  }

  if (delegationState.error) {
    return (
      <Dialog title={t('team.transferNode.inviteDialog.title')} fullWidth open onClose={onCancel}>
        <Alert severity="error">{formatError(delegationState.error)}</Alert>
      </Dialog>
    );
  }

  const onCreate = async () => {
    setError(null);
    setLoading(true);

    try {
      const { inviteInfo: tmpInviteInfo } = await api.createTransferInvitation({
        input: { teamDid, role: 'owner', remark: remark.trim() },
      });
      setInviteInfo(tmpInviteInfo);
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

  const handleTransferNFT = () => {
    setOpenTransferNFTAuth(true);
    setActiveStep(1);
  };

  const handleCancelTransferNFT = () => {
    setOpenTransferNFTAuth(false);
    setActiveStep(0);
  };

  const steps = [
    {
      body: (
        <Typography component="div">
          <Alert severity="warning">
            <Typography>{t('team.transferNode.inviteDialog.tips.progress')}</Typography>
            <Typography>{t('team.transferNode.inviteDialog.tips.newOwnerPermissions')}</Typography>
          </Alert>
          <Alert severity="warning">
            <Typography>{t('team.transferNode.inviteDialog.tips.revoke')}</Typography>
          </Alert>
          <div style={{ marginTop: 20, marginBottom: 10 }} />
          <TextField
            label={t('common.remark')}
            autoComplete="off"
            variant="outlined"
            fullWidth
            style={{ marginBottom: 8 }}
            value={remark}
            onChange={(e) => {
              setError(null);
              setRemark(e.target.value);
            }}
            disabled={loading}
            data-cy="transfer-node-input-remark"
          />
          <div style={{ marginTop: 20, marginBottom: 10 }} />
        </Typography>
      ),
      cancel: t('common.cancel'),
      confirm: t('team.transferNode.inviteDialog.createInviteLink'),
      onCancel,
      onConfirm: needTransferNFT && !get(delegationState, 'value.delegated') ? handleTransferNFT : onCreate,
    },
    {
      body: () => {
        return (
          <Connect
            action="delegate-transfer-nft"
            open={openTransferNFTAuth}
            locale={locale}
            checkFn={sessionAPI.get}
            onClose={handleCancelTransferNFT}
            onSuccess={onCreate}
            checkTimeout={5 * 60 * 1000}
            webWalletUrl={getWebWalletUrl(info)}
            extraParams={{ targetDID: info.did }}
            messages={{
              title: t('team.transferNode.delegateDialog.title'),
              scan: t('team.transferNode.delegateDialog.scan'),
              confirm: t('team.transferNode.delegateDialog.confirm'),
              success: t('team.transferNode.delegateDialog.success'),
            }}
            popup
          />
        );
      },
    },
    {
      body: () => {
        const link = getInviteLink({
          inviteId: inviteInfo.inviteId,
          endpoint,
        });
        return (
          <div>
            <Bold>
              {t('team.transferNode.inviteDialog.createSuccessTip', {
                expireDate: formatToDatetime(inviteInfo.expireDate, locale),
              })}
            </Bold>
            <div style={{ marginTop: '40px' }} />
            <ClickToCopy>{link}</ClickToCopy>
          </div>
        );
      },
      confirm: t('common.confirm'),
      onConfirm: onSuccess,
    },
  ];
  const step = steps[activeStep];

  return (
    <Dialog
      title={t('team.transferNode.inviteDialog.title')}
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
          <Button onClick={step.onConfirm} color="primary" disabled={loading} variant="contained" autoFocus>
            {loading && <Spinner size={16} />}
            {step.confirm}
          </Button>
        </>
      }>
      <DialogContentText component="div">{typeof step.body === 'function' ? step.body() : step.body}</DialogContentText>
      {!!error && <Alert severity="error">{error}</Alert>}
    </Dialog>
  );
}

TransferMember.propTypes = {
  teamDid: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
  endpoint: PropTypes.string,
};

const Bold = styled.div`
  font-size: 16px;
  font-weight: bold;
`;
