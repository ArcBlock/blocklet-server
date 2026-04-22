import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

import { formatPerson } from '@blocklet/meta/lib/fix';
import Dialog from '@arcblock/ux/lib/Dialog';
import Spinner from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Toast from '@arcblock/ux/lib/Toast';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import InfoRow from '@arcblock/ux/lib/InfoRow';
import DidConnect, { useSecurity } from '@arcblock/did-connect-react/lib/Connect';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import Alert from '@mui/material/Alert';
import { LOGIN_PROVIDER } from '@arcblock/ux/lib/Util/constant';
import { getDisplayName } from '@blocklet/meta/lib/util';
import { joinURL, withQuery } from 'ufo';
import { useMemoizedFn } from 'ahooks';

import { useNodeContext } from '../contexts/node';
import { useSessionContext } from '../contexts/session';
import { formatError } from '../util';
import { getWalletType } from './util';
import DidAddress from '../did-address';
import BlockletOwnerInfo from './component/blocklet-owner-info';
import InstallBlockletFromUrlInput from './install-blocklet-from-url-input';
import { useBlockletInstallUrlRecord } from '../hooks/use-blocklet-install-url-record';
import WithoutWallet from './without-wallet';

export default function InstallFromUrl({
  defaultUrl = '',
  onCancel,
  onSuccess,
  onError = () => {},
  mode = 'install',
  handleText = {},
}) {
  const { api } = useNodeContext();
  const { api: $api, session } = useSessionContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, locale } = useLocaleContext();
  const initMeta = { dist: {} };
  const { encryptKey } = useSecurity();

  const [url, setUrl] = useState(defaultUrl);
  const [activeStep, setActiveStep] = useState(defaultUrl ? 1 : 0);

  const [meta, setMeta] = useState(initMeta);
  const [isConnectOpen, setConnectOpen] = useState(false);
  const [nw, setNw] = useState('');
  const [instantLaunch] = useLocalStorage('instant-blocklet-install', false);

  const [params, setParams] = useState({});

  const isComponentMode = mode === 'component';
  // if mode is component , we need to always show the step, that means the user can return to the previous step
  const alwayShowSteps = isComponentMode ? true : !defaultUrl;
  const { addUrlRecord } = useBlockletInstallUrlRecord();

  const existWalletAccount = useMemo(() => {
    const connectedAccounts = session.user?.connectedAccounts || [];
    const onlyWallet = connectedAccounts.some((x) => x.provider === LOGIN_PROVIDER.WALLET);
    return onlyWallet;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.user]);

  const metaUrl = useMemo(() => {
    let inputUrl = url.trim();
    if (!inputUrl.startsWith('https://') && !inputUrl.startsWith('http://') && !inputUrl.startsWith('file://')) {
      inputUrl = `file://${inputUrl}`;
    }
    return inputUrl;
  }, [url]);

  const onGetMeta = async () => {
    setMeta(initMeta);
    setError(null);
    setLoading(true);

    const inputUrl = metaUrl;
    try {
      const decoded = decodeURIComponent(inputUrl);
      // validate
      try {
        new URL(decoded); // eslint-disable-line no-new
      } catch {
        throw new Error('Invalid URL');
      }

      // request
      const { meta: newer, inStore, registryUrl } = await api.getBlockletMetaFromUrl({ input: { url: decoded } });

      setMeta(newer);

      setParams({
        inStore,
        registryUrl,
        inputUrl,
      });
      addUrlRecord(inputUrl);
    } catch (err) {
      console.error(err);
      const errMsg = `Blocklet Install failed: ${formatError(err)}`;
      setError(errMsg);
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = () => {
    if (isComponentMode) {
      onSuccess({ meta, ...params });
      onCancel();
      return;
    }

    if (instantLaunch) {
      setLoading(true);
      setConnectOpen(true);
      return;
    }

    // FIXME: 统一 blocklet 的启动流程，这里重定向到 server 的 launcher 页面
    const launcherUrl = joinURL(window?.env?.apiPrefix ?? '/', '/launch-blocklet/install');

    window.location.href = withQuery(launcherUrl, {
      blocklet_meta_url: decodeURIComponent(metaUrl.trim()),
      from: 'url',
    });
  };

  const onEndInstall = () => {
    setLoading(false);
    setConnectOpen(false);
    onSuccess({
      meta,
      ...params,
    });

    onCancel();
  };

  const onCancelInstall = () => {
    setLoading(false);
    setConnectOpen(false);
  };

  useEffect(() => {
    if (defaultUrl) {
      onGetMeta();
    }
  }, [defaultUrl]); // eslint-disable-line

  const defaultExtraParams = useMemo(() => {
    return {
      title: meta.title,
      wt: getWalletType(meta),
      blockletMetaUrl: decodeURIComponent(url.trim()),
    };
  }, [meta, url]);

  const getNextWorkFlow = useCallback(async () => {
    if (existWalletAccount || instantLaunch) {
      setNw('');
      return undefined;
    }
    const nextUrl = new URL(window.location.href);
    nextUrl.pathname = joinURL(window?.env?.apiPrefix ?? '/', '/api/did/launch-free-blocklet-by-session/token');
    nextUrl.searchParams.set('_ek_', encryptKey);
    Object.keys(defaultExtraParams).forEach((key) => {
      nextUrl.searchParams.set(key, defaultExtraParams[key]);
    });
    const { data } = await $api.get(nextUrl.href);
    if (data.url) {
      setNw(data.url);
    } else {
      setNw('');
    }
    return undefined;
  }, [existWalletAccount, defaultExtraParams, $api, encryptKey, instantLaunch]);

  useEffect(() => {
    getNextWorkFlow();
  }, [getNextWorkFlow]);

  const extraParams = useMemo(() => {
    if (existWalletAccount && nw) {
      return {
        ...defaultExtraParams,
        nw,
        skipMigrateAccount: true,
      };
    }
    return defaultExtraParams;
  }, [defaultExtraParams, nw, existWalletAccount]);

  const rows = [
    { name: t('common.name'), value: getDisplayName({ meta }, true) },
    { name: t('common.version'), value: meta.version },
    { name: t('common.did'), value: meta.did ? <DidAddress did={meta.did} /> : null },
    {
      name: t('common.author'),
      value: meta.owner ? <BlockletOwnerInfo owner={meta.owner} locale={locale} /> : formatPerson(meta.author),
    },
    { name: t('blocklet.dist.downloadLink'), value: meta.dist.tarball },
  ];

  const getStep1Body = () => {
    if (loading) {
      return (
        <div
          style={{
            height: 200,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
          <Spinner />
        </div>
      );
    }
    if (meta.did) {
      return (
        <div style={{ paddingLeft: '10%' }}>
          {rows.map((row) => {
            if (row.name === t('common.did')) {
              return (
                <InfoRow
                  valueComponent="div"
                  key={row.name}
                  nameWidth={120}
                  name={row.name}
                  nameFormatter={() => t('common.did')}>
                  {row.value}
                </InfoRow>
              );
            }
            return (
              <InfoRow valueComponent="div" key={row.name} nameWidth={120} name={row.name}>
                {row.value}
              </InfoRow>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const handleLaunchBlockletWithoutWallet = useMemoizedFn(async () => {
    let appName = meta.title;
    if (session.user) {
      // Just in case the name is too long
      const betterName = `${session.user.fullName}'s ${meta.title}`;
      appName = betterName;
    }
    try {
      onEndInstall();
      await api.launchBlockletWithoutWallet({
        input: {
          title: appName,
          blockletMetaUrl: decodeURIComponent(url.trim()),
          type: 'store',
          storeUrl: params.registryUrl,
          onlyRequired: true,
        },
      });
    } catch (e) {
      console.error('launchBlockletWithoutWallet error:', e);
      Toast.error(formatError(e), { autoHideDuration: 3000 });
    }
  });

  const steps = [
    {
      label: t('blocklet.fromUrl.step0'),
      body: (
        <Typography component="div">
          <InstallBlockletFromUrlInput
            style={{ marginBottom: 32 }}
            value={url}
            helperText={t('blocklet.fromUrl.description')}
            onValueChange={(v) => {
              setError(null);
              setUrl(v);
            }}>
            <TextField
              label={t('blocklet.fromUrl.label')}
              autoComplete="off"
              variant="outlined"
              name="url"
              data-cy="blocklet-url-input"
              fullWidth
              autoFocus
              margin="dense"
              value={url}
              onChange={(e) => {
                setError(null);
                setUrl(e.target.value);
              }}
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onGetMeta();
                  setActiveStep(1);
                }
              }}
            />
          </InstallBlockletFromUrlInput>
        </Typography>
      ),
      cancel: t('common.cancel'),
      confirm: t('common.next'),
      onCancel,
      onConfirm: () => {
        onGetMeta();
        setActiveStep(1);
      },
    },
    {
      label: t('blocklet.fromUrl.step1'),
      body: getStep1Body(),
      cancel: alwayShowSteps ? t('common.pre') : t('common.cancel'),
      confirm: handleText?.confirm || t('blocklet.fromUrl.confirm'),
      onCancel: () => {
        if (alwayShowSteps) {
          setActiveStep((s) => s - 1);
        } else {
          onCancel();
        }
      },
      onConfirm: () => {
        onConfirm();
      },
    },
  ];
  const step = steps[activeStep];

  return (
    <>
      <Dialog
        title={handleText?.title || t('blocklet.fromUrl.title')}
        fullWidth
        maxWidth="md"
        onClose={() => step.onCancel()}
        showCloseButton={activeStep === 0}
        disableEscapeKeyDown
        open
        actions={
          <>
            {step.cancel && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setError(null);
                  step.onCancel();
                }}
                color="inherit">
                {step.cancel || t('common.cancel')}
              </Button>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                step.onConfirm();
              }}
              color="primary"
              data-cy="install-blocklet-next-step"
              disabled={loading || !url || error}
              variant="contained"
              autoFocus
              style={{ marginLeft: 8 }}>
              {loading && activeStep === 0 && <Spinner size={16} />}
              {step.confirm}
            </Button>
          </>
        }>
        {alwayShowSteps && (
          <Stepper alternativeLabel activeStep={activeStep}>
            {steps.map(({ label }) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
        <DialogContentText
          component="div"
          style={{
            marginTop: 24,
          }}>
          {step.body}
        </DialogContentText>
        {!!error && (
          <Alert severity="error" style={{ width: '100%', marginTop: 8 }}>
            {error}
          </Alert>
        )}
      </Dialog>
      {meta && isConnectOpen && (
        <DidConnect
          popup
          open
          forceConnected={false}
          className="launch-from-url-auth"
          action={!existWalletAccount && !instantLaunch ? 'bind-wallet' : 'launch-free-blocklet-by-session'}
          checkFn={$api.get}
          checkTimeout={5 * 60 * 1000}
          onSuccess={onEndInstall}
          extraParams={extraParams}
          messages={{
            title: t('setup.keyPair.title'),
            scan: t('setup.keyPair.scan'),
            confirm: t('setup.keyPair.confirm'),
            success: t('setup.keyPair.success'),
          }}
          onClose={onCancelInstall}
          customItems={instantLaunch ? [] : [<WithoutWallet onClick={handleLaunchBlockletWithoutWallet} />]}
        />
      )}
    </>
  );
}

InstallFromUrl.propTypes = {
  defaultUrl: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
  mode: PropTypes.oneOf(['install', 'component']),
  handleText: PropTypes.object,
};
