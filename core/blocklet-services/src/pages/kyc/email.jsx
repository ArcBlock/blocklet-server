/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import trim from 'lodash/trim';
import styled from '@emotion/styled';
import isEmail from 'validator/lib/isEmail';
import { fromBase64 } from '@ocap/util';
import { useSearchParams } from 'react-router-dom';
import DID from '@arcblock/ux/lib/DID';
import Fullpage from '@arcblock/did-connect-react/lib/Connect/fullpage';
import SessionManager from '@arcblock/did-connect-react/lib/SessionManager';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { isFromWallet } from '@abtnode/ux/lib/util';
import { formatError } from '@blocklet/error';
import { Helmet } from 'react-helmet';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';
import CheckIcon from '@mui/icons-material/CheckCircle';
import VerifyIcon from '@mui/icons-material/MarkEmailRead';
import { TextField, Box, Button, CircularProgress, Typography, Stack, Link } from '@mui/material';
import { VERIFY_CODE_LENGTH } from '@abtnode/constant';
import Toast from '@arcblock/ux/lib/Toast';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';

import api from '../../libs/api';
import { useSessionContext } from '../../contexts/session';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;

  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  div.Mui-focused input {
    caret-color: ${(props) => props.theme.palette.primary.main};
  }
`;

const tryDecodeEmail = (encodedSubject) => {
  try {
    if (!encodedSubject) return null;
    const decoded = fromBase64(encodedSubject).toString();
    return isEmail(decoded) ? decoded : null;
  } catch {
    return null;
  }
};

export default function EmailVerification() {
  const containerRef = useRef(null);
  const { session, connectApi } = useSessionContext();
  const { t, locale } = useLocaleContext();
  const [email, setEmail] = useState(session.user?.email || '');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [updateKycOpen, setUpdateKycOpen] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const { wallet: isWalletWebview } = useBrowser();
  const [params] = useSearchParams();
  const inviter = params.get('inviter') || localStorage.getItem('inviter');

  const shouldUpdateKyc = params.get('updateKyc') === '1';

  useEffect(() => {
    const subject = params.get('subject');
    const decodedEmail = tryDecodeEmail(subject);
    if (decodedEmail) {
      setEmail(decodedEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session.user?.emailVerified && shouldUpdateKyc) {
      setIsVerified(true);
      setTimeout(() => {
        if (isWalletWebview && isFromWallet()) {
          import('dsbridge').then((jsBridge) => {
            jsBridge.call('arcClosePage');
          });
          return;
        }

        // 假定为内部值，严格限制 allowDomains
        window.location.href = getSafeUrlWithToast(params.get('redirect') || '/');
      }, 1000);
    }
  }, [session.user, shouldUpdateKyc, isWalletWebview, params]);

  const handleSendCode = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        await api.post(`/kyc/email/send?locale=${locale}`, { email });
        setIsCodeSent(true);
        Toast.success(t('login.issueKyc.codeSentSuccess'));
      } catch (error) {
        Toast.error(formatError(error));
        document.getElementById('email-input')?.focus();
      } finally {
        setIsLoading(false);
      }
    },
    [email, locale, t]
  );

  const handleVerifyCode = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      setIsLoading(true);
      try {
        await api.post(`/kyc/email/verify?locale=${locale}`, { code });
        setIsVerified(true);
        connectApi.open({
          locale,
          action: 'issue-kyc',
          extraParams: { code, updateKyc: params.get('updateKyc') || '0', inviter: inviter || '' },
          className: 'connect',
          popup: true,
          saveConnect: false,
          forceConnected: true,
          hideCloseButton: true,
          messages: {
            title: t('login.issueKyc.claim'),
            scan: t('login.issueKyc.scan'),
            confirm: t('login.issueKyc.confirm'),
            success: t('login.issueKyc.success'),
          },
          useSocket: true,
          onSuccess: () => {
            setIsClaimed(true);
            connectApi.close();
            if (shouldUpdateKyc) {
              session.refresh({ showProgress: false, forceRefreshToken: true });
              setTimeout(() => {
                if (isWalletWebview && isFromWallet()) {
                  import('dsbridge').then((jsBridge) => {
                    jsBridge.call('arcClosePage');
                  });
                  return;
                }

                // 假定为内部值，严格限制 allowDomains
                window.location.href = getSafeUrlWithToast(params.get('redirect') || '/');
              }, 1000);
            } else if (isWalletWebview && isFromWallet()) {
              import('dsbridge').then((jsBridge) => {
                jsBridge.call('arcClosePage');
              });
            }
          },
          onError: (error) => {
            Toast.error(formatError(error));
          },
        });
      } catch (error) {
        setIsVerified(false);
        Toast.error(formatError(error));
        document.getElementById(`code-input-${trim(code).length - 1}`)?.focus();
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [code, locale, params, shouldUpdateKyc, isWalletWebview, inviter]
  );

  useEffect(() => {
    if (isCodeSent && trim(code).length === VERIFY_CODE_LENGTH) {
      handleVerifyCode();
    }
  }, [code, handleVerifyCode, isCodeSent]);

  const handleUpdateKyc = useCallback(() => {
    setUpdateKycOpen(true);
    connectApi.open({
      locale,
      action: 'update-kyc',
      className: 'connect',
      popup: true,
      saveConnect: false,
      forceConnected: true,
      hideCloseButton: true,
      messages: {
        title: t('login.updateKyc.title'),
        scan: t('login.updateKyc.scan'),
        confirm: t('login.updateKyc.confirm'),
        success: t('login.updateKyc.success'),
      },
      useSocket: true,
      onSuccess: () => {
        session.refresh({ showProgress: false, forceRefreshToken: true });
        setTimeout(() => {
          if (isWalletWebview && isFromWallet()) {
            import('dsbridge').then((jsBridge) => {
              jsBridge.call('arcClosePage');
            });
            return;
          }

          // 假定为内部值，严格限制 allowDomains
          window.location.href = getSafeUrlWithToast(params.get('redirect') || '/');
        }, 2000);
      },
      onError: (error) => {
        Toast.error(formatError(error));
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, params, isWalletWebview]);

  const handlePaste = useCallback(
    (e) => {
      if (!isCodeSent) return;
      e.preventDefault();
      const pastedData = trim(e.clipboardData.getData('text/plain').slice(0, VERIFY_CODE_LENGTH));
      if (!/^\d+$/.test(pastedData)) return;
      setCode(pastedData.padEnd(VERIFY_CODE_LENGTH, ' '));
      const nextInput = document.getElementById(`code-input-${pastedData.length}`);
      if (nextInput) {
        nextInput.focus();
      }
    },
    [isCodeSent]
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const pageTitle = isFromWallet() ? t('login.issueKyc.issueTitle') : t('login.issueKyc.verifyTitle');
  const pageAction = isFromWallet() ? t('login.issueKyc.issueAction') : t('login.issueKyc.verifyAction');

  return (
    <Fullpage did={window.blocklet?.appPid}>
      <Helmet>
        <title>
          {pageTitle} | {window.blocklet?.appName}
        </title>
      </Helmet>
      <Stack
        direction="column"
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '560px',
          px: 2,
          boxSizing: 'border-box',
          maxWidth: '100%',
          height: '100%',
        }}>
        <Stack
          spacing={1}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            mb: 3,
          }}>
          {isClaimed ? (
            <CheckIcon sx={{ fontSize: 72 }} color="success" />
          ) : (
            <VerifyIcon sx={{ fontSize: 72 }} color="primary" />
          )}
          <Typography variant="h5" sx={{ textAlign: 'center' }}>
            {pageTitle}
          </Typography>
          {!isClaimed && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                textAlign: 'center',
              }}>
              {t('login.issueKyc.pageDescription')}
            </Typography>
          )}
          {isClaimed && (
            <Typography variant="body1" sx={{ textAlign: 'center' }}>
              {t('login.issueKyc.success')}
            </Typography>
          )}
          {isClaimed && (
            <Button variant="contained" color="primary" component={Link} href="/" size="large">
              {t('login.issueKyc.backToHome')}
            </Button>
          )}
          {!isClaimed && session.user && (
            <Stack
              direction="column"
              sx={{
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'info.main',
                  textAlign: 'center',
                  mt: 1,
                }}>
                {t('login.issueKyc.issueTarget', { action: pageAction })}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: 360,
                }}>
                <DID did={session.user.did} responsive copyable showQrcode={false} />
                <SessionManager locale={locale} session={session} showRole showManageBlocklet={false} />
              </Stack>
            </Stack>
          )}
        </Stack>
        <Box ref={containerRef} sx={{ width: '100%' }}>
          {!isVerified && !updateKycOpen && (
            <Form onSubmit={isCodeSent ? handleVerifyCode : handleSendCode}>
              {!isCodeSent && (
                <TextField
                  type="email"
                  id="email-input"
                  placeholder={t('login.issueKyc.emailPlaceholder')}
                  sx={{ width: '100%', maxWidth: 360 }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              )}
              {isCodeSent && (
                <Stack
                  direction="column"
                  spacing={2}
                  sx={{
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: 'center',
                    }}>
                    {t('login.issueKyc.codeSentMessage', { email })}
                  </Typography>
                  <Box sx={{ width: '100%', maxWidth: 360, display: 'flex', justifyContent: 'space-between' }}>
                    {[...Array(VERIFY_CODE_LENGTH)].map((_, index) => (
                      <TextField
                        key={`code-input-${index}`}
                        value={trim(code[index]) || ''}
                        type="number"
                        sx={{ width: '14%' }}
                        onChange={(e) => {
                          const newCode = code.split('');
                          newCode[index] = e.target.value;
                          setCode(newCode.join(''));
                          if (e.target.value && index < 5) {
                            document.getElementById(`code-input-${index + 1}`)?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !trim(code[index]) && index > 0) {
                            document.getElementById(`code-input-${index - 1}`)?.focus();
                          }
                        }}
                        disabled={isLoading}
                        required
                        id={`code-input-${index}`}
                        autoComplete="off"
                        slotProps={{
                          htmlInput: {
                            maxLength: 1,
                            style: { textAlign: 'center', fontSize: '1.5rem' },
                            autoComplete: 'off',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Stack>
              )}
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  justifyContent: shouldUpdateKyc ? 'space-between' : 'center',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: 360,
                }}>
                {shouldUpdateKyc && (
                  <Button variant="text" disabled={isLoading} onClick={handleUpdateKyc} size="large">
                    {t('login.updateKyc.button')}
                  </Button>
                )}
                <Button
                  type="submit"
                  size="large"
                  variant="contained"
                  disabled={isLoading || !email || (isCodeSent && trim(code).length !== VERIFY_CODE_LENGTH)}
                  sx={{ width: shouldUpdateKyc ? 'auto' : '100%' }}>
                  {isLoading ? (
                    <CircularProgress size={24} />
                  ) : isCodeSent ? (
                    t('login.issueKyc.verifyButton')
                  ) : (
                    t('login.issueKyc.sendCodeButton')
                  )}
                </Button>
              </Stack>
            </Form>
          )}
        </Box>
      </Stack>
    </Fullpage>
  );
}
