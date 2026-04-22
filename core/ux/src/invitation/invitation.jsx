import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useRequest } from 'ahooks';
import Result from '@arcblock/ux/lib/Result';
import { Box, CircularProgress, styled } from '@mui/material';

import InvitationPassport from './invitation-passport';
import InvitationReceive from './invitation-receive';
import InvitationLogin from './invitation-login';
import InvitationUser from './invitation-user';
import InvitationSuccess from './invitation-success';
import wrapLocale from '../wrap-locale';

function Invitation({
  getDataFn,
  passportColor = 'auto',
  createPassportSvg,
  onLoginSuccess = () => {},
  checkFn,
  onReceive = null,
  inService = false,
  action = 'invite',
  status = '',
}) {
  const state = useRequest(getDataFn);

  const orgId = useMemo(() => state?.data?.orgId || '', [state?.data?.orgId]);

  if (state?.loading) {
    return <CircularProgress />;
  }

  if (state?.error) {
    return <Result status="404" title={state?.error?.response?.data} description="" />;
  }

  const isSuccess = status === 'success' || state?.data?.status === 'success';

  const SectionHeader = isSuccess ? InvitationSuccess : InvitationUser;
  const SectionFooter = isSuccess ? InvitationLogin : InvitationReceive;

  return (
    <Root className="page-invite__wrapper">
      {state?.data ? (
        <Box className="page-invite__card">
          <SectionHeader invitation={state.data} />
          <InvitationPassport
            invitation={state.data}
            action={action}
            createPassportSvg={createPassportSvg}
            passportColor={passportColor}
          />
          <SectionFooter
            invitation={state.data}
            action={action}
            onLogin={onLoginSuccess}
            checkFn={checkFn}
            onReceive={onReceive}
            inService={inService}
            orgId={orgId}
          />
        </Box>
      ) : null}
    </Root>
  );
}

Invitation.propTypes = {
  getDataFn: PropTypes.func.isRequired,
  checkFn: PropTypes.func.isRequired,
  createPassportSvg: PropTypes.func.isRequired,
  onLoginSuccess: PropTypes.func,
  onReceive: PropTypes.func,
  passportColor: PropTypes.string,
  inService: PropTypes.bool,
  action: PropTypes.oneOf(['invite', 'issue-passpor']),
  status: PropTypes.oneOf(['success', '']),
};

const Root = styled(Box)`
  max-width: 460px;
  max-height: 650px;
  min-height: 450px;
  width: 90%;
  height: 80%;
  display: flex;
  flex-direction: column;
  margin: auto;
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.05);
  .page-invite__card {
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: 12px;
    flex: 1;
    padding: 20px 30px;
  }
  .page-invite__app {
    margin-top: 20px;
  }
`;

export default wrapLocale(Invitation);
