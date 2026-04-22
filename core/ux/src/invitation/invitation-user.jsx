/* eslint-disable react/no-unstable-nested-components */
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import DidAvatar from '@arcblock/did-connect-react/lib/Avatar';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getExplorerLink, patchJsxToLocale } from '../util';

function InvitationUser({ invitation }) {
  const { t } = useLocaleContext();
  const roleName = useMemo(() => {
    const role = invitation.role.title || invitation.role.name;
    return role.toUpperCase();
  }, [invitation.role.title, invitation.role.name]);

  const message = useMemo(() => {
    return t('invite.message', {
      name: '{{name}}',
      role: roleName,
      dapp: '{{dapp}}',
    });
  }, [t, roleName]);

  const accountLink = getExplorerLink(invitation.info.chainHost, invitation.inviter.did, 'account');

  const messageList = patchJsxToLocale(message, {
    name() {
      return accountLink ? (
        <a key="name" target="_blank" href={accountLink} className="invite-user__link" rel="noreferrer">
          {invitation.inviter.fullName}
        </a>
      ) : (
        invitation.inviter.fullName
      );
    },
    dapp() {
      return (
        <a key="dapp" target="_blank" href={invitation.info.url} className="invite-user__link" rel="noreferrer">
          {invitation.info.name}
        </a>
      );
    },
  });

  return (
    <Root>
      <DidAvatar
        did={invitation.inviter.did}
        src={encodeURI(invitation.inviter.avatar)}
        size={80}
        shape="circle"
        variant="circle"
      />
      <div className="invite-user__message">{messageList}</div>
    </Root>
  );
}

InvitationUser.propTypes = {
  invitation: PropTypes.object.isRequired,
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .invite-user__name {
    font-weight: 700;
    font-size: 16px;
    margin: 8px 0 2px 0;
  }
  .invite-user__address {
    font-size: 12px;
  }
  .invite-user__message {
    margin-top: 20px;
    font-weight: 700;
    /* width: 90%; */
    text-align: center;
    font-size: 18px;
  }
  .invite-user__link {
    color: ${({ theme }) => theme.palette.primary.main};
  }
`;

export default InvitationUser;
