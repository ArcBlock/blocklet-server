import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import DidAvatar from '@arcblock/did-connect-react/lib/Avatar';

function InvitationApp({ invitation, ...rest }) {
  return (
    <Root {...rest}>
      <DidAvatar did={invitation.info.did} src={invitation.info.logo} style={{ flexShrink: 0 }} />
      <div className="invite-app__content">
        <div className="invite-app__title">{invitation.info.name}</div>
        <div className="invite-app__description">{invitation.info.description}</div>
      </div>
    </Root>
  );
}

InvitationApp.propTypes = {
  invitation: PropTypes.object.isRequired,
};

const Root = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  .invite-app__content {
    flex: 1;
    margin: 0 12px;
    font-weight: 700;
    overflow: hidden;
  }
  .invite-app__title {
    line-height: 1;
    margin-bottom: 2px;
    overflow: hidden;
  }
  .invite-app__description {
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
    height: 1.3em;
    color: #999;
    overflow: hidden;
  }
`;

export default InvitationApp;
