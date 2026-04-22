import PropTypes from 'prop-types';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import pull from 'lodash/pull';
import noop from 'lodash/noop';
import isEmpty from 'lodash/isEmpty';
import { getDidDomainForBlocklet } from '@abtnode/util/lib/get-domain-for-blocklet';
import { useContext, useImperativeHandle } from 'react';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useCreation, useMemoizedFn, useReactive } from 'ahooks';
import { useTheme } from '@arcblock/ux/lib/Theme';
import { Box, Button, CircularProgress, SvgIcon } from '@mui/material';
import Address from '@arcblock/did-connect-react/lib/Address';
import Dialog from '@arcblock/ux/lib/Dialog';
import StarsIcon from '@mui/icons-material/Stars';
import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import { useBlockletContext } from '../../../contexts/blocklet';
import { useNodeContext } from '../../../contexts/node';

export default function FederatedDetailDialog({ ref = null }) {
  const { t } = useContext(LocaleContext);
  const { blocklet } = useBlockletContext();
  const { api } = useNodeContext();
  const state = useReactive({
    loadingReject: false,
    loadingApprove: false,
    mode: 'view',
    show: false,
    data: {},
    callback: noop,
  });
  const theme = useTheme();
  const leavingScreen = theme?.transitions?.duration?.leavingScreen || 300;

  const reset = useMemoizedFn(() => {
    state.mode = 'view';
    state.data = {};
    state.callback = noop;
  }, []);
  const close = useMemoizedFn(() => {
    state.show = false;
    setTimeout(() => {
      reset();
    }, leavingScreen);
  }, []);
  const open = useMemoizedFn((data) => {
    state.mode = 'view';
    state.show = true;
    state.data = data;
  }, []);
  const approve = useMemoizedFn((data, callback = noop) => {
    state.mode = 'approve';
    state.show = true;
    state.data = data;
    state.callback = callback;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      open,
      close,
      approve,
    }),
    [open, close, approve]
  );

  const infoList = useCreation(() => {
    if (!state.show) {
      return [];
    }
    state.data.migratedFrom = [state.data.appId, state.data.appPid];
    const keys = [
      'appName',
      'appLogo',
      'appId',
      'appPid',
      'migratedFrom',
      'appDescription',
      'appUrl',
      'version',
      'appliedAt',
      'status',
      'serverId',
      'serverVersion',
    ];
    if (state.data.isMaster !== false) {
      pull(keys, 'appliedAt', 'status');
    }
    return keys.map((key) => {
      const name = t(`federated.info.${key}`);
      let value = state.data[key];

      if (key === 'appName') {
        if (state.data.isMaster) {
          value = (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}>
              <SvgIcon component={StarsIcon} />
              {value}
            </Box>
          );
        }
      }
      if (['appId', 'appPid', 'serverId'].includes(key)) {
        value = <Address>{value}</Address>;
      }
      if (['appUrl'].includes(key)) {
        value = (
          <Box component="a" href={value} target="_blank">
            {value}
          </Box>
        );
      }
      if (['appLogo'].includes(key)) {
        const logoUrl = joinURL(
          `https://${getDidDomainForBlocklet({ did: state.data.appPid })}`,
          WELLKNOWN_SERVICE_PATH_PREFIX,
          '/blocklet/logo'
        );
        try {
          const logoUrlInstance = new URL(logoUrl);
          logoUrlInstance.searchParams.set('imageFilter', 'resize');
          // HACK: 保持跟其他地方使用的尺寸一致，可以复用同一资源的缓存，减少网络请求
          logoUrlInstance.searchParams.set('w', '80');
          logoUrlInstance.searchParams.set('h', '80');
          value = <img src={logoUrlInstance.href} width="60" height="60" alt={state.data.appName} />;
        } catch {
          value = <img src={logoUrl} width="60" height="60" alt={state.data.appName} />;
        }
      }
      if (key === 'status') {
        value = value && t(`federated.status.${value}`);
      }
      if (key === 'migratedFrom') {
        const migratedFrom = state.data.migratedFrom || [];
        const filterDids = migratedFrom.filter((item) => ![state.data.appId, state.data.appPid].includes(item));

        value = filterDids.map((item) => <Address>{item}</Address>);
      }
      if (isEmpty(value)) {
        value = '-';
      }
      return {
        name,
        value,
      };
    });
  }, [state.data]);

  const isApprove = state.mode === 'approve';

  const onReject = useMemoizedFn(async () => {
    try {
      state.loadingReject = true;
      await api.auditFederatedLogin({
        input: {
          memberPid: state.data.appPid,
          did: blocklet.appPid,
          status: 'rejected',
        },
      });
      close();
      state?.callback(false);
    } finally {
      state.loadingReject = false;
    }
  });
  const onApprove = useMemoizedFn(async () => {
    try {
      state.loadingApprove = true;
      await api.auditFederatedLogin({
        input: {
          memberPid: state.data.appPid,
          did: blocklet.appPid,
          status: 'approved',
        },
      });
      close();
      state?.callback(true);
    } finally {
      state.loadingApprove = false;
    }
  });

  return (
    <Dialog
      open={state.show}
      title={isApprove ? t('federated.approveToJoinLogin') : t('federated.siteDetail')}
      onClose={close}
      actions={
        isApprove ? (
          <>
            <Button color="error" variant="contained" onClick={onReject} disabled={state.loadingReject}>
              {state.loadingReject ? <CircularProgress size={16} color="grey" /> : null}
              {t('common.reject')}
            </Button>
            <Button variant="contained" onClick={onApprove} disabled={state.loadingApprove}>
              {state.loadingApprove ? <CircularProgress size={16} color="grey" /> : null}
              {t('common.approve')}
            </Button>
          </>
        ) : (
          <Button variant="outlined" onClick={close}>
            {t('common.close')}
          </Button>
        )
      }>
      {infoList.map((row) => (
        <InfoRow
          style={{ alignItems: 'flex-start' }}
          valueComponent="div"
          key={row.name}
          nameWidth={180}
          name={row.name}>
          {row.value}
        </InfoRow>
      ))}
    </Dialog>
  );
}

FederatedDetailDialog.propTypes = {
  ref: PropTypes.any,
};
