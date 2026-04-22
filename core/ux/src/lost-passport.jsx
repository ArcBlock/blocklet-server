/* eslint-disable react/no-unstable-nested-components */
import { useContext, useRef, useState } from 'react';
import styled from '@emotion/styled';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ViewListIcon from '@mui/icons-material/ViewList';
import GetAppIcon from '@mui/icons-material/GetApp';
import CompleteIcon from '@mui/icons-material/Done';
import { Avatar, Box, Stepper, Step, StepLabel, useMediaQuery, Typography, Container, Link } from '@mui/material';
import Button from '@arcblock/ux/lib/Button';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';
import { useCountDown, useReactive } from 'ahooks';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import isFunction from 'lodash/isFunction';

import CardSelector from './card-selector';
import DidAddress from './did-address';
import wrapLocale from './wrap-locale';
import usePassportId from './hooks/use-passport-id';
import { isFromWallet } from './util';
import getSafeUrlWithToast from './util/get-safe-url';

// eslint-disable-next-line react/prop-types
function ColorStepIcon({ icon, active, completed }) {
  const icons = {
    1: <ViewListIcon className="step-icon" />,
    2: <GetAppIcon className="step-icon" />,
    3: <CompleteIcon className="step-icon" />,
  };

  const classNames = ['step-icon-w'];
  if (active) {
    classNames.push('step-icon-w--active');
  }
  if (completed) {
    classNames.push('step-icon-w--completed');
  }

  return <div className={classNames.join(' ')}>{icons[String(icon)]}</div>;
}

// eslint-disable-next-line react/prop-types
function LostPassport({ SessionContext, webWalletUrl, createPassportSvg, passportColor, onLogin, teamDid }) {
  const { api } = useContext(SessionContext);
  const isSmallMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const pageState = useReactive({
    user: null,
    passport: null,
    success: false,
    activeStep: 0,
  });
  const staticState = useRef({
    sessionToken: '',
    refreshToken: '',
    csrfToken: '',
  });
  const { setPassportId, clearPassportId } = usePassportId();
  const { t, locale } = useContext(LocaleContext);
  const { wallet: isWalletWebview } = useBrowser();
  const [leftTime, setLeftTime] = useState(0);

  // eslint-disable-next-line no-undef
  const { searchParams } = new URL(window.location.href);

  const onNext = () => {
    pageState.activeStep++;
  };

  const onGetUser = (result) => {
    pageState.user = result.user;
  };

  const onSelectPassport = () => {
    onNext();
  };

  const onReceivePassport = (result, decrypt) => {
    if (result?.passportId) {
      setPassportId(result.passportId);
    }
    if (result?.sessionToken) {
      staticState.current.sessionToken = decrypt(result.sessionToken);
    }
    if (result?.refreshToken) {
      staticState.current.refreshToken = decrypt(result.refreshToken);
    }
    if (result?.csrfToken) {
      staticState.current.csrfToken = decrypt(result.csrfToken);
    }

    pageState.success = true;
    onNext();
  };

  // eslint-disable-next-line require-await
  const onUsePassport = async () => {
    if (isWalletWebview && isFromWallet()) {
      import('dsbridge').then((jsBridge) => {
        jsBridge.call('arcClosePage');
      });
      return;
    }

    if (isFunction(onLogin)) {
      onLogin({
        sessionToken: staticState.current.sessionToken,
        refreshToken: staticState.current.refreshToken,
        csrfToken: staticState.current.csrfToken,
      });
    }

    const redirect = searchParams.get('redirect');

    if (redirect) {
      // 假定为内部值，严格限制 allowDomains
      window.location.replace(getSafeUrlWithToast(redirect));
      return;
    }

    // HACK: 因为默认页面不会处理 passportId 的逻辑，所以需要清除存储的信息
    clearPassportId();
    window.location.replace('/');
  };

  const handleChangePassport = (event) => {
    pageState.passport = event.target.value;
  };

  const [countdown] = useCountDown({
    leftTime,
    onEnd: () => {
      onUsePassport();
    },
  });

  const steps = [
    {
      label: t('lostPassport.recoverPassport'),
      content: () => {
        if (!pageState.user) {
          const scope = searchParams.get('scope') || 'passport';
          return (
            <DidConnect
              popup
              open
              hideCloseButton
              className="connect"
              action="lost-passport-list"
              forceConnected={false}
              autoConnect={false}
              checkFn={api.get}
              checkTimeout={10 * 60 * 1000}
              webWalletUrl={webWalletUrl}
              onSuccess={onGetUser}
              locale={locale}
              messages={{
                title: t('lostPassport.recoverDialog.title'),
                scan: t('lostPassport.recoverDialog.scan'),
                confirm: t('lostPassport.recoverDialog.confirm'),
                success: t('lostPassport.recoverDialog.success'),
              }}
              extraParams={{
                scope,
              }}
            />
          );
        }
        return (
          <Box className="select-passport">
            {/* user info */}
            <Box
              className="user-info"
              sx={{
                my: 1,
                display: 'flex',
                alignItems: 'center',
              }}>
              <Avatar
                src={pageState.user.avatar}
                style={{ width: 48, height: 48, backgroundColor: 'transparent', marginRight: 16 }}
              />
              <Box>
                <Box className="name">{pageState.user.fullName}</Box>
                <Box
                  className="did"
                  sx={{
                    mt: 1,
                  }}>
                  <DidAddress responsive={!isSmallMobile} compact={isSmallMobile} did={pageState.user.did} />
                </Box>
              </Box>
            </Box>
            {/* passports */}
            <Box>
              <CardSelector
                width={isSmallMobile ? 180 : 230}
                height={isSmallMobile ? 240 : 306}
                cardSpace={24}
                list={pageState.user.passportTypes.map((x) => {
                  return {
                    src: createPassportSvg({
                      scope: x.scope,
                      role: x.role,
                      title: x.scope === 'kyc' ? x.name : x.title,
                      issuer: x.issuer.name,
                      issuerDid: x.issuer.id,
                      ownerDid: pageState.user.did,
                      ownerName: pageState.user.fullName,
                      ownerAvatarUrl: pageState.user.avatar,
                      preferredColor: passportColor || 'auto',
                      extra: x.scope === 'kyc' ? { key: 'Email', value: x.name } : undefined,
                    }),
                    name: x.title,
                    id: x.id,
                    display: x.display,
                  };
                })}
                onSelect={(index) =>
                  handleChangePassport({
                    target: {
                      value: pageState.user.passportTypes[index].id,
                    },
                  })
                }
                defaultIndex={0}
              />
            </Box>
            {/* action */}
            <Box
              sx={{
                textAlign: 'center',
              }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => onSelectPassport()}
                disabled={!pageState.passport}>
                {t('common.next')}
              </Button>
            </Box>
          </Box>
        );
      },
    },
    {
      label: t('lostPassport.receivePassport'),
      content: () => {
        const extraParams = {
          receiverDid: pageState.user.did,
          passportId: pageState.passport,
          teamDid: teamDid || window?.blocklet?.did,
        };
        return (
          <DidConnect
            popup
            open
            hideCloseButton
            className="connect"
            action="lost-passport-issue"
            checkFn={api.get}
            checkTimeout={10 * 60 * 1000}
            webWalletUrl={webWalletUrl}
            onSuccess={onReceivePassport}
            forceConnected={false}
            locale={locale}
            messages={{
              title: `${t('lostPassport.receiveDialog.title')}`,
              scan: t('lostPassport.receiveDialog.scan'),
              confirm: t('lostPassport.receiveDialog.confirm'),
              success: t('lostPassport.receiveDialog.success'),
            }}
            extraParams={extraParams}
          />
        );
      },
    },
    {
      label: t('common.complete'),
      content: () => {
        if (leftTime === 0) {
          setLeftTime(3000);
        }
        return (
          <Box
            sx={{
              textAlign: 'center',
            }}>
            <Box
              sx={{
                mb: 3,
                color: 'success.main',
              }}>
              <CheckCircleIcon style={{ fontSize: 60 }} />
            </Box>
            <Typography component="p" variant="body1" className="subheader">
              {t('issuePassport.dialog.success')}
            </Typography>
            <Typography component="p" variant="body2" color="gray">
              {isWalletWebview && isFromWallet()
                ? t('issuePassport.dialog.autoClose', { seconds: Math.round(countdown / 1000) })
                : t('issuePassport.dialog.autoJump', { seconds: Math.round(countdown / 1000) })}
            </Typography>
            <Button style={{ marginTop: 40 }} variant="contained" color="primary" onClick={onUsePassport}>
              {t('issuePassport.dialog.loginWithPassport')}
            </Button>
          </Box>
        );
      },
    },
  ];

  return (
    <Div>
      <Box className="stepper">
        <Stepper className="stepper-progress" alternativeLabel activeStep={pageState.activeStep}>
          {steps.map(({ label }) => (
            <Step key={label}>
              <StepLabel
                slots={{
                  stepIcon: ColorStepIcon,
                }}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box className="stepper-content">{steps[pageState.activeStep].content()}</Box>

        {!pageState.success && (
          <Box
            sx={{
              textAlign: 'center',
              fontSize: 12,
            }}>
            <Link href="/" sx={{ color: '#4598FA', textDecoration: 'none' }}>
              {t('lostPassport.return')}
            </Link>
          </Box>
        )}
      </Box>
    </Div>
  );
}

const Div = styled(Container)`
  padding-top: 46px;
  padding-bottom: 46px;
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  @media (max-width: ${(props) => props.theme.breakpoints.values.sm}px) {
    display: block;
  }
  .header {
    text-align: center;
    margin-bottom: 24px;
  }

  .stepper {
    padding: 24px;
    height: auto;
    width: 100%;
    min-height: 640px;
    display: flex;
    flex-direction: column;

    @media (max-width: ${(props) => props.theme.breakpoints.values.sm}px) {
      min-height: auto;
    }

    .stepper-progress {
      padding: 0;
      flex: 0;
      margin-bottom: 24px;

      .MuiStepLabel-label.MuiStepLabel-alternativeLabel {
        margin-top: 8px;
      }

      .MuiStepConnector-alternativeLabel {
        top: 24px;
      }

      .MuiStepConnector-lineHorizontal {
        height: 3px;
        border: none;
        background-color: #eaeaf0;
        border-radius: 1px;
      }

      .step-icon-w {
        background-color: ${(props) => props.theme.palette.grey[500]};
        z-index: 1;
        color: ${(props) => props.theme.palette.common.white};
        width: 50px;
        height: 50px;
        display: flex;
        border-radius: 50%;
        justify-content: center;
        align-items: center;
        .step-icon {
          font-size: 30px;
        }
      }

      .step-icon-w--active {
        background-color: ${(props) => props.theme.palette.primary.main};
      }

      .step-icon-w--completed {
        background-color: ${(props) => props.theme.palette.secondary.main};
      }
    }

    .stepper-content {
      padding: 0 64px;
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 24px;

      .stepper-icon {
        margin-left: 40px;
      }

      .stepper-auth {
        padding: 0;

        .auth-title {
          margin-bottom: 16px;
        }
      }

      .stepper-tip {
        text-align: center;
        margin-bottom: 16px;
      }
      @media (max-width: ${(props) => props.theme.breakpoints.values.sm}px) {
        padding: 0;
      }
    }

    .stepper-actions {
      flex: 0;
      text-align: right;
      padding: 0 64px;
      display: none;
      .step-button {
        margin-right: 8px;
      }
    }

    .select-passport {
      width: 80%;
      @media (max-width: ${(props) => props.theme.breakpoints.values.sm}px) {
        width: 100%;
      }
    }

    .user-info {
      .name {
        font-weight: 500;
        font-size: 18px;
        line-height: 25px;
        color: ${(props) => props.theme.palette.text.primary};
      }
    }
  }

  .connect {
    background: #fafafa;
  }
`;

export default wrapLocale(LostPassport);
