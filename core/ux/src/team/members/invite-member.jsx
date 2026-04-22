import PropTypes from 'prop-types';
import {
  Alert,
  Box,
  CircularProgress,
  DialogContentText,
  MenuItem,
  Select,
  TextField,
  InputLabel,
  FormControl,
  Typography,
} from '@mui/material';
import { useReactive } from 'ahooks';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import DID from '@arcblock/ux/lib/DID';
import Avatar from '@arcblock/ux/lib/Avatar';
import copy from 'copy-to-clipboard';
import Toast from '@arcblock/ux/lib/Toast';
import dayjs from '@abtnode/util/lib/dayjs';
import ArrowDownwardIcon from '@arcblock/icons/lib/ArrowDown';

import ClickToCopy from '../../click-to-copy';
import { useNodeContext } from '../../contexts/node';
import { formatError, getInviteLink, formatToDatetime } from '../../util';
import TimeSelect from './time-select';

export default function InviteMember({
  teamDid,
  roles = [],
  isFederated = false,
  apps = [],
  onCancel,
  onSuccess,
  onError = () => {},
  endpoint = '',
}) {
  const { api } = useNodeContext();
  const { t, locale } = useLocaleContext();

  const currentState = useReactive({
    loading: false,
    error: null,
    activeStep: 0,
    inviteInfo: null,
    role: '',
    remark: '',
    sourceAppPid: isFederated && apps.length > 0 ? apps[0].appPid : null,
    display: null,
    passportExpireTime: null,
    showPicker: false,
  });

  const onCreate = async () => {
    if (!currentState.role) {
      currentState.error = t('team.member.error.passportEmpty');
      return;
    }
    if (currentState.passportExpireTime && dayjs(currentState.passportExpireTime).isBefore(dayjs())) {
      currentState.error = t('team.passport.customExpireTimeIsInvalid');
      return;
    }

    const trimRemark = currentState.remark.trim();

    currentState.error = null;
    currentState.loading = true;

    try {
      let sourceAppPid = currentState.sourceAppPid ?? null;
      if (sourceAppPid === teamDid) {
        sourceAppPid = null;
      }
      const args = {
        teamDid,
        role: currentState.role,
        remark: trimRemark,
        sourceAppPid,
        passportExpireTime: currentState.passportExpireTime ? currentState.passportExpireTime.toISOString() : '',
      };
      if (currentState.display) {
        args.display = { type: 'url', content: currentState.display };
      }

      const { inviteInfo } = await api.createMemberInvitation({ input: args });
      currentState.inviteInfo = inviteInfo;
      currentState.activeStep = 1;
    } catch (err) {
      const errMsg = formatError(err);
      currentState.error = errMsg;
      onError(err);
    } finally {
      currentState.loading = false;
    }
  };

  const selectedRole = roles.find((r) => r.name === currentState.role);
  const filteredRoles = roles.filter((r) => r.name !== 'owner');

  const steps = [
    {
      body: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {apps.length > 1 ? (
            <FormControl fullWidth>
              <InputLabel>{t('common.sourceApp')}</InputLabel>
              <Select
                value={currentState.sourceAppPid}
                onChange={(e) => {
                  currentState.error = null;
                  currentState.sourceAppPid = e.target.value;
                }}
                fullWidth
                label={t('common.passport')}
                disabled={currentState.loading}>
                {apps.map((r) => (
                  <MenuItem key={r.appPid} value={r.appPid}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 2,
                        width: '100%',
                      }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}>
                        <Avatar did={r.appPid} size={28} />
                        {r.appName}
                      </Box>
                      <DID did={r.appPid} compact responsive={false} />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
          <FormControl variant="outlined" style={{ width: '100%' }}>
            <InputLabel>{t('common.passport')}</InputLabel>
            <Select
              data-cy="invite-member-select-role"
              value={currentState.role}
              onChange={(e) => {
                currentState.error = null;
                currentState.role = e.target.value;
              }}
              fullWidth
              label={t('common.passport')}
              disabled={currentState.loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCreate();
                }
              }}
              // eslint-disable-next-line react/no-unstable-nested-components
              IconComponent={(props) => <ArrowDownwardIcon {...props} width={20} height={20} />}>
              {filteredRoles.map((r) => (
                <MenuItem key={r.name} value={r.name} data-cy={`invite-member-select-option-${r.name}`}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1">{r.title || r.name}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.7,
                        maxWidth: 500,
                        whiteSpace: 'break-spaces',
                        textAlign: 'justify',
                      }}>
                      {r.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedRole?.extra?.display === 'custom' && (
            <TextField
              label={t('common.display')}
              type="url"
              value={currentState.display}
              onChange={(e) => {
                currentState.error = null;
                currentState.display = e.target.value;
              }}
              fullWidth
              variant="outlined"
              margin="normal"
            />
          )}
          <TextField
            label={t('common.remark')}
            autoComplete="off"
            variant="outlined"
            fullWidth
            value={currentState.remark}
            onChange={(e) => {
              currentState.error = null;
              currentState.remark = e.target.value;
            }}
            disabled={currentState.loading}
            data-cy="invite-member-input-remark"
          />
          <TimeSelect
            value={currentState.passportExpireTime}
            onChange={(newValue) => {
              currentState.error = null;
              currentState.passportExpireTime = newValue;
            }}
            showError={false}
          />
        </Box>
      ),
      cancel: t('common.cancel'),
      confirm: t('team.member.inviteDialog.createInviteLink'),
      onCancel,
      onConfirm: onCreate,
    },
    {
      // eslint-disable-next-line react/no-unstable-nested-components
      body: () => {
        const link = getInviteLink({ inviteId: currentState.inviteInfo?.inviteId, endpoint });
        return (
          <div>
            <Box
              sx={{
                fontSize: 16,
                fontWeight: 'bold',
              }}>
              {t('team.member.inviteDialog.createSuccessTip', {
                expireDate: formatToDatetime(currentState.inviteInfo?.expireDate, locale),
              })}
            </Box>
            <div style={{ marginTop: '40px' }} />
            <ClickToCopy>{link}</ClickToCopy>
          </div>
        );
      },
      confirm: t('common.copy'),
      onConfirm: () => {
        const link = getInviteLink({ inviteId: currentState.inviteInfo?.inviteId, endpoint });

        if (process.env.NODE_ENV === 'e2e' || ['1', 'true'].includes(process.env.IS_E2E)) {
          onSuccess();
          return;
        }

        copy(link);
        Toast.success(t('common.copied'));
        onSuccess();
      },
      cancel: t('common.cancel'),
      onCancel,
    },
  ];
  const step = steps[currentState.activeStep];

  return (
    <Dialog
      title={t('common.invite')}
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
            color="primary"
            disabled={currentState.loading || !currentState.role}
            variant="contained"
            autoFocus>
            {currentState.loading && <CircularProgress size={16} />}
            {step.confirm}
          </Button>
        </>
      }>
      <DialogContentText component="div">{typeof step.body === 'function' ? step.body() : step.body}</DialogContentText>

      {!!currentState.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {currentState.error}
        </Alert>
      )}
    </Dialog>
  );
}

InviteMember.propTypes = {
  teamDid: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
  roles: PropTypes.array,
  apps: PropTypes.array,
  endpoint: PropTypes.string,
  isFederated: PropTypes.bool, // 是否属于站点群应用
};
