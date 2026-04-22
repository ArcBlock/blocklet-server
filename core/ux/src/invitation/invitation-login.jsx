import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import DidButton from '@arcblock/did-connect-react/lib/Button';

function InvitationLogin({ onLogin = () => {} }) {
  const { t } = useLocaleContext();

  return (
    <Root>
      <DidButton
        size="large"
        variant="contained"
        className="invite-receive__button"
        data-cy="invite-receive-passport"
        color="primary"
        onClick={() => onLogin()}>
        {t('common.connect')}
      </DidButton>
    </Root>
  );
}

InvitationLogin.propTypes = {
  onLogin: PropTypes.func,
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

export default InvitationLogin;
