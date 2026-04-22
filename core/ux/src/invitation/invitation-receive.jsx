import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import DidButton from '@arcblock/did-connect-react/lib/Button';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { API_DID_PREFIX } from '@arcblock/did-connect-react/lib/constant';
import { joinURL } from 'ufo';
import { useMemoizedFn, useMount, useReactive } from 'ahooks';

import { formatDateTime } from '../util';
import usePassportId from '../hooks/use-passport-id';
import { useSessionContext } from '../contexts/session';
import blockletSdk from '../util/sdk';

function InvitationReceive({
  invitation,
  onLogin = () => {},
  onReceive = null,
  inService = false,
  action = 'invite',
  orgId = '',
}) {
  const { t, locale } = useLocaleContext();
  const { connectApi } = useSessionContext();
  const { getPassportId } = usePassportId();

  let componentId;
  if (typeof window !== 'undefined') {
    componentId = window?.blocklet?.componentId;
  }

  const currentState = useReactive({
    loading: false,
    extraParams: {
      // 生成 passport 信息需要 baseUrl 字段
      baseUrl: window.location.origin,
      componentId,
      sourceAppPid: invitation?.sourceAppPid || null,
    },
  });

  useMount(async () => {
    const passportId = getPassportId();
    if (passportId) {
      currentState.extraParams.passportId = passportId;
    }
    if (action === 'invite') {
      currentState.extraParams.inviteId = invitation.inviteId;
      currentState.extraParams.orgId = orgId;
    } else if (action === 'issue-passport') {
      currentState.extraParams.inviteId = invitation.inviteId;
      currentState.extraParams.id = invitation.inviteId;
    }
    if (inService && invitation?.receiver?.did) {
      currentState.loading = true;
      try {
        const publicInfo = await blockletSdk.user.getUserPublicInfo({ did: invitation.receiver.did });
        if (publicInfo?.sourceAppPid) {
          currentState.extraParams.sourceAppPid = publicInfo.sourceAppPid;
        }
      } finally {
        currentState.loading = false;
      }
    }
  });

  const onClose = useMemoizedFn(() => {
    connectApi.close();
  });

  const onSuccess = useMemoizedFn((...args) => {
    connectApi.close();
    onLogin(...args);
  });

  const onClickReceive = useMemoizedFn(() => {
    if (typeof onReceive === 'function') {
      onReceive();
      return;
    }

    const forceConnected = invitation?.receiver?.did || false;
    const messageScan = forceConnected
      ? t('receive.dialog.scanWithDid', { did: invitation?.receiver?.did })
      : t('receive.dialog.scan');

    if (inService) {
      connectApi.open(
        {
          action,
          className: 'connect',
          forceConnected,
          autoConnect: false,
          disableSwitchApp: true,
          locale,
          extraParams: {
            provider: 'wallet',
            ...currentState.extraParams,
          },
          baseUrl: window.location.origin,
          prefix: joinURL(window.location.origin, WELLKNOWN_SERVICE_PATH_PREFIX, API_DID_PREFIX),
          messages: {
            title: t('receive.dialog.title'),
            scan: messageScan,
            confirm: t('receive.dialog.confirm'),
            success: t('receive.dialog.success'),
          },
          // passkeyBehavior: action === 'invite' ? 'both' : undefined,
          onSuccess,
          onClose,
          passkeyBehavior: !orgId ? 'both' : 'only-existing',
        },
        { locale }
      );
    } else {
      connectApi.open(
        {
          action,
          className: 'connect',
          forceConnected,
          autoConnect: false,
          disableSwitchApp: true,
          locale,
          extraParams: currentState.extraParams,
          messages: {
            title: t('receive.dialog.title'),
            scan: messageScan,
            confirm: t('receive.dialog.confirm'),
            success: t('receive.dialog.success'),
          },
          // passkeyBehavior: action === 'invite' ? 'both' : undefined,
          onSuccess,
          onClose,
          passkeyBehavior: !orgId ? 'both' : 'only-existing',
        },
        { locale }
      );
    }
  });

  return (
    <Root>
      <DidButton
        loading={currentState.loading}
        size="large"
        variant="contained"
        className="invite-receive__button"
        data-cy="invite-receive-passport"
        color="primary"
        onClick={onClickReceive}>
        {t('invite.receive')}
      </DidButton>
      <div className="invite-receive__until">
        {t('invite.validUntil')}
        {formatDateTime(invitation.expireDate, locale)}
      </div>
    </Root>
  );
}

InvitationReceive.propTypes = {
  invitation: PropTypes.object.isRequired,
  onLogin: PropTypes.func,
  onReceive: PropTypes.func,
  inService: PropTypes.bool,
  action: PropTypes.oneOf(['invite', 'issue-passport']),
  orgId: PropTypes.string,
};

const Root = styled.div`
  text-align: center;
  .invite-receive__logo-wrapper {
    display: inline-flex;
    align-items: center;
    color: #9397a1;
    font-size: 14px;
  }
  .invite-receive__logo {
    height: 16px;
    margin-left: 8px;
  }
  .invite-receive__button {
    width: 100%;
    margin: 16px 0;
    white-space: nowrap;
  }
  .invite-receive__until {
    text-align: center;
    font-size: 14px;
  }
  .invite-receive__description {
    color: #999;
    text-align: left;
    list-style: decimal;
    padding: 0;
    padding-left: 1.2em;
    margin: 40px 0;
  }
  .invite-receive__description-item {
    list-style: decimal;
  }
  .invite-receive__link {
    color: ${({ theme }) => theme.palette.primary.main};
  }
`;

export default InvitationReceive;
