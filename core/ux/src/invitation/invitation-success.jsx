/* eslint-disable react/no-unstable-nested-components */
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getExplorerLink, patchJsxToLocale } from '../util';

function InvitationSuccess({ invitation, type = 'inviter' }) {
  const { t } = useLocaleContext();

  const message = useMemo(() => {
    return t('invite.success', {
      dapp: '{{dapp}}',
    });
  }, [t]);

  const accountLink = getExplorerLink(invitation.info.chainHost, invitation.inviter.did, 'account');

  const user = type === 'receiver' ? invitation.receiver : invitation.inviter;

  const messageList = patchJsxToLocale(message, {
    name() {
      return accountLink ? (
        <a key="name" target="_blank" href={accountLink} className="invite-user__link" rel="noreferrer">
          {user.fullName}
        </a>
      ) : (
        user.fullName
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
      <Box
        sx={{
          pt: 1,
          color: 'success.main',
        }}>
        <CheckCircleIcon style={{ fontSize: 80 }} />
      </Box>
      <div className="invite-user__message">{messageList}</div>
    </Root>
  );
}

InvitationSuccess.propTypes = {
  invitation: PropTypes.object.isRequired,
  type: PropTypes.oneOf(['inviter', 'receiver']),
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

export default InvitationSuccess;
