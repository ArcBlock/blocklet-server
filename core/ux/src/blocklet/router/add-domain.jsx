import { getDidDomainServiceURL } from '@abtnode/util/lib/did-domain';
import { formatTopLevelDidDomain } from '@abtnode/util/lib/domain';
import Center from '@arcblock/ux/lib/Center';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import useMobile from '@blocklet/ui-react/lib/hooks/use-mobile';
import IconInfo from '@mui/icons-material/InfoOutlined';
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme, alpha } from '@mui/material';
import noop from 'lodash/noop';
import trim from 'lodash/trim';
import pRetry from 'p-retry';
import PropTypes from 'prop-types';
import useAsync from 'react-use/lib/useAsync';
import useSetState from 'react-use/lib/useSetState';
import { getDisplayName, getAppUrl } from '@blocklet/meta/lib/util';

import useConnect from '@arcblock/did-connect-react/lib/Connect/use-connect';
import { formatError } from '@blocklet/error';
import ConfirmDialog from '../../confirm';
import { useBlockletContext } from '../../contexts/blocklet';
import { useDomainContext } from '../../contexts/domain';
import { useNodeContext } from '../../contexts/node';
import { validateDomain } from '../../util';
import DNSTip from './dns-tip';
import { parseDomainFromURL } from './util';
import DNSConfigure from './dns-config';
import { useConflictDomain } from './hook';

export default function AddDomain({
  siteId,
  teamDid,
  cnameDomain,
  defaultCustomDomain = '',
  onInputDomain = noop,
  appId = '',
  appPk = '',
  onSuccess = noop,
  onError = noop,
  disabled = false,
  autoFocus = true,
  inBlockletSetup = false,
  shouldCheckDomain = false,
  onStateChange = noop,
  currentIp = '',
  ...rest
}) {
  const { t, locale } = useLocaleContext();
  const { api, info } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const domainContext = useDomainContext();
  const theme = useTheme();
  const isMobile = useMobile({ key: 'sm' });
  const [state, setState] = useSetState({
    submittingDomain: false,
    domain: defaultCustomDomain,
    error: null,
    type: info?.nftDomainUrl ? 'nftDomain' : 'inputDomain',
    showDnsTip: false,
  });
  const appName = getDisplayName(blocklet);
  const { checkConflict } = useConflictDomain();

  const { connectApi } = useConnect();
  const nftDomainURLState = useAsync(() => getDidDomainServiceURL(info?.nftDomainUrl));

  if (info?.nftDomainUrl && nftDomainURLState.loading) {
    return (
      <Box {...rest} onError={onError} currentIp={currentIp}>
        <Center relative="parent">
          <CircularProgress />
        </Center>
      </Box>
    );
  }

  if (nftDomainURLState.error) {
    return (
      <Box {...rest} onError={onError} currentIp={currentIp}>
        <Center relative="parent">{nftDomainURLState.error.message}</Center>
      </Box>
    );
  }

  const nftDomainService = nftDomainURLState.value;

  const resetState = () => {
    setState({ invalidDNSDomain: null });
  };

  const addCustomDomainAlias = async (domain, disable, force = false) => {
    await api.addDomainAlias({
      input: { id: siteId, domainAlias: domain, teamDid, inBlockletSetup: true, force },
    });

    setState({ submittingDomain: false });
    onSuccess({ domain, type: 'inputDomain', canGenerateCertificate: !disable });
  };

  const addDomain = async (domain, disable) => {
    onStateChange(t('setting.domain.addingDomain'));

    try {
      await addCustomDomainAlias(domain, disable, false);
    } catch (error) {
      console.error(error);
      resetState();

      if (formatError(error).includes('already exists')) {
        await checkConflict(domain, () => addCustomDomainAlias(domain, disable, true));
        return;
      }

      Toast.error(formatError(error));
    }
  };

  const submitDomain = async ({ domain, type, nftDid, chainHost }) => {
    try {
      if (!shouldCheckDomain) {
        if (type === 'inputDomain') {
          await addDomain(domain);
          return;
        }

        onSuccess({ domain, type, nftDid, chainHost });
        return;
      }
      onStateChange({ text: t('setting.domain.checkingResolvable') });

      let counter = 30;
      const timeout = 3000;
      const retries = import.meta.env?.PROD || process?.env?.NODE_ENV === 'production' ? (counter * 1000) / timeout : 0; // 重试 10 * 3000 = 30s 左右

      const timer = setInterval(() => {
        if (counter <= 0) {
          clearInterval(timer);
          return;
        }
        onStateChange({ text: `${t('setting.domain.checkingResolvable')} (${counter--}s)` });
      }, 1000);

      const dns = await pRetry(() => api.getDomainDNS({ input: { teamDid, domain } }), {
        retries,
        minTimeout: timeout,
        maxTimeout: timeout,
        onFailedAttempt: console.error,
      });

      clearInterval(timer);

      if (!dns?.isDnsResolved || !dns?.isCnameMatch) {
        let err = '';

        if (!dns.isDnsResolved) {
          err = t('setting.domain.cannotResolve', { domain });
        } else if (!dns.isCnameMatch) {
          err = t('setting.domain.resolvedAddressError', { domain, curDomain: cnameDomain });
        }

        if (type === 'nftDomain') {
          Toast.error(err);
          onSuccess({ domain, type: 'nftDomain' });
          return;
        }

        onStateChange({ text: '' });
        setState({
          invalidDNSDomain: { domain, error: err },
          domain,
          type,
          submittingDomain: false,
        });
        return;
      }

      if (type === 'nftDomain') {
        onSuccess({ domain, type: 'nftDomain' });
        return;
      }

      await addDomain(domain);
    } catch (err) {
      Toast.error(err.message);
      onStateChange({ text: '' });
      setState({ submittingDomain: false });
      // For nftDomain type, still call onSuccess to close the parent dialog
      if (type === 'nftDomain') {
        onSuccess({ domain, type: 'nftDomain', error: err.message });
      }
    }
  };

  const addDidDomainAlias = async ({ domain, nftDid, chainHost, force }) => {
    // Parse and format the domain - for nft-domain, naked domains get www prefix (same as server)
    const parsedDomain = parseDomainFromURL(domain);
    const tmpDomain = formatTopLevelDidDomain(parsedDomain);

    setState({ submittingDomain: true });
    await api.addDomainAlias({
      input: {
        id: siteId,
        type: 'nft-domain',
        domainAlias: tmpDomain,
        nftDid,
        chainHost,
        teamDid,
        inBlockletSetup,
        force,
      },
    });

    const type = 'nftDomain';
    setState({ type });
    await submitDomain({ domain: tmpDomain, type, nftDid, chainHost });
  };
  const handleAuthSuccess = async ({ domain, nftDid, chainHost, isDomainOwner }) => {
    if (!isDomainOwner) {
      const msg = t('router.domainAlias.addDomainNFT.authorizeFailed');
      Toast.error(msg);
      setState({ submittingDomain: false, error: msg });
      return;
    }

    // Format domain for conflict check display - naked domains get www prefix
    const formattedDomain = formatTopLevelDidDomain(parseDomainFromURL(domain));

    try {
      await addDidDomainAlias({ domain, nftDid, chainHost, force: false });
    } catch (error) {
      console.error(error);
      resetState();

      if (formatError(error).includes('already exists')) {
        await checkConflict(formattedDomain, () => addDidDomainAlias({ domain, nftDid, chainHost, force: true }));
        return;
      }

      Toast.error(formatError(error));
    } finally {
      setState({ submittingDomain: false });
    }
  };

  const handleAdd = async () => {
    try {
      setState({ submittingDomain: true });
      const domain = parseDomainFromURL(state.domain);

      if (info.nftDomainUrl && nftDomainService) {
        const result = await api.isDidDomain({ input: { domain } });
        if (result.value === true) {
          connectApi.openPopup(
            {
              prefix: '/connect-to-did-domain',
              custom: true,
              locale,
              extraParams: {
                provider: 'wallet',
                delegatee: appId,
                delegateePk: appPk,
                domain: state.domain,
                appName,
                appUrl: getAppUrl(blocklet),
              },
              message: {
                title: t('router.domainAlias.addDomainNFT.connect.title', { appName }),
                scan: t('router.domainAlias.addDomainNFT.connect.scan', {
                  domain: state.domain,
                  appName,
                }),
                confirm: t('router.domainAlias.addDomainNFT.connect.confirm'),
                success: t('router.domainAlias.addDomainNFT.connect.success'),
              },
              onSuccess: handleAuthSuccess,
              onError: (error) => {
                Toast.error(error.message);
                setState({ submittingDomain: false });
              },
              onClose: () => setState({ submittingDomain: false }),
              checkTimeout: 60 * 5000,
            },
            {
              baseUrl: nftDomainService.base,
              locale,
            }
          );
          return;
        }
      }

      await submitDomain({ domain, type: state.type });
    } catch (error) {
      setState({ submittingDomain: false });
      domainContext.setError(error.message);
    }
  };

  const error = domainContext.error || state.error; // TODO: state error 可能不需要了

  return (
    <Box {...rest} onError={onError} currentIp={currentIp}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          gap: '1em',
        }}>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
          <Typography sx={{ color: theme.palette.text.primary }}>{t('router.domainAlias.add.tips')}</Typography>
          <TextField
            sx={{ display: 'block', marginTop: '8px' }}
            label={t('router.domainAlias.add.domainDescription')}
            helperText={(state.type === 'inputDomain' && error) || t('router.domainAlias.add.helperText')}
            fullWidth
            disabled={disabled}
            value={state.domain}
            size="small"
            variant="outlined"
            error={!!error && state.type === 'inputDomain'}
            onChange={(e) => {
              const value = trim(e.target?.value);

              domainContext.setDomain(value);

              const errMessage = validateDomain(value, locale);

              setState({ domain: value, error: errMessage, type: 'inputDomain' });
              onInputDomain({ domain: value, error: errMessage, type: 'inputDomain' });
            }}
            autoFocus={autoFocus}
            onBlur={() => {
              if (!domainContext.domain) {
                setState({ error: null });
                domainContext.setError(null);
              }
            }}
            slotProps={{
              htmlInput: { 'data-cy': 'domain-name-input' },
            }}
          />
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
            <LoadingButton
              data-cy="confirm-add-domain"
              fullWidth={isMobile}
              variant="contained"
              loading={state.submittingDomain}
              type="submit">
              {t('common.add')}
            </LoadingButton>
          </Box>
          <Box
            sx={{
              backgroundColor: () => alpha(theme.palette.primary.light, 0.1),
              borderRadius: '8px',
              padding: '12px',
            }}>
            {t('router.domainAlias.addDomainNFT.topLevelDidDomainHint')}
          </Box>
          <Box
            sx={{
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              lineHeight: 1,
              color: theme.palette.primary.main,
            }}
            onClick={() => setState({ showDnsTip: !state.showDnsTip })}>
            <IconInfo fontSize="1em" />
            {t('router.domainAlias.showTipHint')}
          </Box>
          {state.showDnsTip && (
            <DNSTip domain={state.domain} resolvedTarget={cnameDomain} style={{ marginTop: '4px' }} />
          )}
        </Box>
        {state.invalidDNSDomain && (
          <ConfirmDialog
            maxWidth="md"
            title={t('common.reminder')}
            description={
              <Stack
                sx={{
                  gap: 2,
                }}>
                <Alert severity="warning">
                  {t('setting.domain.invalidDNSReminder', { error: state.invalidDNSDomain.error })}
                </Alert>
                <DNSConfigure url={state.domain} domain={cnameDomain} />
              </Stack>
            }
            color="primary"
            confirm={t('setting.domain.continueAdd')}
            onConfirm={() => addDomain(state.invalidDNSDomain.domain, state.type)}
            onCancel={resetState}
          />
        )}
      </Box>
    </Box>
  );
}

AddDomain.propTypes = {
  siteId: PropTypes.string.isRequired,
  currentIp: PropTypes.string,
  teamDid: PropTypes.string.isRequired,
  cnameDomain: PropTypes.string.isRequired,
  defaultCustomDomain: PropTypes.string,
  onInputDomain: PropTypes.func,
  onSuccess: PropTypes.func,
  appId: PropTypes.string,
  appPk: PropTypes.string,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  inBlockletSetup: PropTypes.bool,
  shouldCheckDomain: PropTypes.bool,
  onStateChange: PropTypes.func,
  onError: PropTypes.func,
};
