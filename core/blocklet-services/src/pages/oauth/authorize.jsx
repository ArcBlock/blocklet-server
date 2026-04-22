import React, { useEffect, useState, useCallback } from 'react';
import { useSetState } from 'ahooks';
import { joinURL } from 'ufo';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Link,
  Stack,
  Tooltip,
  CircularProgress,
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  useMediaQuery,
} from '@mui/material';
import { WELLKNOWN_SERVICE_PATH_PREFIX, OAUTH_SCOPES } from '@abtnode/constant';
import Fullpage from '@arcblock/did-connect-react/lib/Connect/fullpage';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Helmet } from 'react-helmet';
import DidAddress from '@abtnode/ux/lib/did-address';
import Img from '@arcblock/ux/lib/Img';
import { DIDConnectContainer } from '@arcblock/ux/lib/DIDConnect';
import Result from '@arcblock/ux/lib/Result';
import HomeIcon from '@mui/icons-material/Home';
import api from '../../libs/api';
import { useSessionContext } from '../../contexts/session';

export default function OAuthAuthorization() {
  const { searchParams } = new URL(window.location.href);
  const { session } = useSessionContext();
  const { t } = useLocaleContext();
  const clientId = searchParams.get('client_id');
  const scopeParam = searchParams.get('scope') || 'profile:read';
  const [selectedScopes, setSelectedScopes] = useState(scopeParam.split(' ').filter(Boolean));
  const isMobile = useMediaQuery('(max-width: 600px)');
  const url = joinURL(window.location.origin, WELLKNOWN_SERVICE_PATH_PREFIX, '/oauth/authorize');

  const getClientLogoUrl = useCallback((uri) => {
    if (!uri) return '';

    if (uri.startsWith('http')) {
      return uri;
    }

    return `${joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/api/media/upload', window.blocklet.appPid)}/${uri}`;
  }, []);

  const [state, setState] = useSetState({
    client: null,
    loading: true,
  });

  useEffect(() => {
    const getDataFn = async () => {
      const { data } = await api.get('/oauth/client', { params: { clientId } });
      setState({ client: data, loading: false });
    };

    getDataFn();
  }, [clientId, setState]);

  const handleScopeChange = (scope) => {
    if (scope === 'profile:read') return; // profile:read is always required

    setSelectedScopes((prev) => {
      if (prev.includes(scope)) {
        return prev.filter((s) => s !== scope);
      }
      return [...prev, scope];
    });
  };

  if (state.loading || !session?.user) {
    return (
      <Fullpage did={window.blocklet?.appPid} standalone>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      </Fullpage>
    );
  }

  if (!state.client) {
    return (
      <Fullpage did={window.blocklet?.appPid} standalone>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Result
            style={{ backgroundColor: 'transparent' }}
            status="error"
            title={t('notFoundOauthClient')}
            extra={
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<HomeIcon />}
                href="/"
                style={{ borderRadius: 4 }}>
                {t('connectCli.home')}
              </Button>
            }
          />
        </Box>
      </Fullpage>
    );
  }

  const { client } = state;
  const { user } = session;

  const clientScopes = (client.scope || '').split(' ');

  return (
    <Fullpage did={window.blocklet?.appPid} standalone>
      <Helmet>
        <title>
          {t('oauth.authorize')} | {window.blocklet?.appName}
        </title>
      </Helmet>
      <DIDConnectContainer hideCloseButton>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: {
              xs: 2,
              lg: 3,
              xl: 4,
            },
            pt: {
              xs: 3,
              xl: 4,
            },
            bgcolor: 'background.paper',
          }}
          className="page-authorize">
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Img src={window.blocklet?.appLogo} alt="Server" width={48} height={48} />
              <Box
                sx={{
                  mx: 2,
                  display: 'flex',
                  alignItems: 'center',
                  '& .dot': {
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'divider',
                    mx: 0.5,
                  },
                }}>
                <Box className="dot" />
                <Box className="dot" />
                <Box className="dot" />
              </Box>
              <Img src={getClientLogoUrl(client.logo_uri)} alt={client.client_name} width={48} height={48} />
            </Box>
            <Typography
              sx={{
                mb: 1,
                fontSize: '1.2rem',
                '& .app-name': {
                  color: 'primary.main',
                },
              }}>
              Authorize <span className="app-name">{client.client_name}</span>
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              overflow: 'hidden',
              mb: 3,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
            className="info">
            <Avatar
              src={user.avatar}
              style={{ width: 48, height: 48, backgroundColor: 'transparent', marginRight: 16 }}
            />
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Tooltip title={user.fullName}>
                <Box
                  className="name"
                  sx={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                  {user.fullName}
                </Box>
              </Tooltip>
              <Box className="did">
                <DidAddress compact responsive={false} did={user.did} showQrcode={!isMobile} />
              </Box>
            </Box>
          </Box>

          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
            Allow {client.client_name} to do the following on your behalf:
          </Typography>

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
            <Box sx={{ p: 2 }}>
              <FormGroup>
                {Object.entries(OAUTH_SCOPES)
                  .filter(([scope]) => clientScopes.includes(scope))
                  .map(([scope, description]) => (
                    <FormControlLabel
                      key={scope}
                      control={
                        <Checkbox
                          checked={selectedScopes.includes(scope)}
                          onChange={() => handleScopeChange(scope)}
                          disabled={
                            scope === 'profile:read' ||
                            (['blocklet:read', 'blocklet:write'].includes(scope) &&
                              !['owner', 'admin', 'member'].includes(user.role))
                          }
                          color="primary"
                          sx={{
                            '&.Mui-checked': {
                              color: 'success.main',
                            },
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {description}
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 0 }}
                    />
                  ))}
              </FormGroup>
            </Box>

            {(client.tos_uri || client.policy_uri) && (
              <>
                <Divider />
                <Box
                  sx={{
                    height: 1,
                    bgcolor: 'divider',
                  }}
                />
                <Box sx={{ p: 2, color: 'text.secondary' }}>
                  <Typography variant="body2">
                    By authorize the access, you also agree with the{' '}
                    {!!client.tos_uri && (
                      <Link href={client.tos_uri} target="_blank">
                        Terms of Use
                      </Link>
                    )}
                    {!!client.tos_uri && !!client.policy_uri && ' and '}
                    {!!client.policy_uri && (
                      <Link href={client.policy_uri} target="_blank">
                        Privacy Policy
                      </Link>
                    )}
                  </Typography>
                </Box>
              </>
            )}
          </Box>

          <form method="POST" action={url}>
            {searchParams.get('client_id') && (
              <input type="hidden" name="client_id" value={searchParams.get('client_id')} />
            )}
            {searchParams.get('response_type') && (
              <input type="hidden" name="response_type" value={searchParams.get('response_type')} />
            )}
            {searchParams.get('redirect_uri') && (
              <input type="hidden" name="redirect_uri" value={searchParams.get('redirect_uri')} />
            )}
            {searchParams.get('code_challenge') && (
              <input type="hidden" name="code_challenge" value={searchParams.get('code_challenge')} />
            )}
            {searchParams.get('code_challenge_method') && (
              <input type="hidden" name="code_challenge_method" value={searchParams.get('code_challenge_method')} />
            )}
            {searchParams.get('state') && <input type="hidden" name="state" value={searchParams.get('state')} />}
            <input type="hidden" name="scope" value={selectedScopes.join(' ')} />
            <Box sx={{ mt: 'auto', pt: 3 }}>
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" size="large" fullWidth type="submit" name="action" value="deny">
                  Cancel
                </Button>
                <Button variant="contained" size="large" fullWidth type="submit" name="action" value="allow">
                  Authorize
                </Button>
              </Stack>
            </Box>

            {searchParams.get('redirect_uri') && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}>
                  You will be redirected to
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    wordBreak: 'break-all',
                  }}>
                  {searchParams.get('redirect_uri')}
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Not you?{' '}
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => session.switchDid()}
                  sx={{
                    p: 0,
                    minWidth: 'auto',
                    textTransform: 'none',
                    verticalAlign: 'baseline',
                    fontWeight: 'inherit',
                    fontSize: 'inherit',
                    '&:hover': {
                      background: 'none',
                      textDecoration: 'underline',
                    },
                  }}>
                  Use another account
                </Button>
              </Typography>
            </Box>
          </form>
        </Box>
      </DIDConnectContainer>
    </Fullpage>
  );
}
