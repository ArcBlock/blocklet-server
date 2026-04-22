/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { useForm, Controller } from 'react-hook-form';

import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { NODE_MODES } from '@abtnode/constant';
import Button from '@arcblock/ux/lib/Button';
import Alert from '@mui/material/Alert';
import Spinner from '@mui/material/CircularProgress';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import SwitchControl from '@abtnode/ux/lib/blocklet/component/switch-control';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Tooltip } from '@mui/material';
import { useAsyncEffect, useReactive } from 'ahooks';
import Toast from '@arcblock/ux/lib/Toast';

import isEmpty from 'lodash/isEmpty';
import { useNodeContext } from '../../contexts/node';
import { sleep, formatError } from '../../libs/util';
import LeavePagePrompt from './leave-page-prompt';
import Permission from '../permission';
import Form from './form';
import { canUseFileSystemIsolateApi } from '../../libs/security';

const initDefaultValues = info => ({
  name: info.name,
  description: info.description,
  registerUrl: info.registerUrl,
  webWalletUrl: info.webWalletUrl,
  nftDomainUrl: info.nftDomainUrl,
  diskAlertThreshold: info.diskAlertThreshold,
  enableWelcomePage: false,
  enableBetaRelease: false,
  enableFileSystemIsolation: true,
  enableDocker: false,
  enableDockerNetwork: false,
  isDockerInstalled: false,
  enableSessionHardening: info.enableSessionHardening || false,
});

export default function BasicSetting({ onSaved, title, submit, disabled = false, ...rest }) {
  const { api, info } = useNodeContext();
  const { t } = useLocaleContext();
  const { control, handleSubmit, formState, reset } = useForm({
    defaultValues: initDefaultValues(info),
  });
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoUpgrade, setAutoUpgrade] = useState(info.autoUpgrade);
  const [enableWelcomePage, setEnableWelcomePage] = useState(!!info.enableWelcomePage);
  const [nodeVersion, setNodeVersion] = useState(null);
  const fileSystemIsolationState = useReactive(
    /** @type {{ enableFileSystemIsolation: boolean, tooltip: string, loading: false | true}} */
    ({
      enableFileSystemIsolation: !!info.enableFileSystemIsolation,
      tooltip: t('setting.form.security.switchTips'),
      loading: false,
    })
  );

  const dockerState = useReactive({
    enableDocker: !!info.enableDocker,
    enableDockerNetwork: !!info.enableDockerNetwork,
    tooltip: t('setting.form.docker.switchTips'),
    isDockerInstalled: !!info.isDockerInstalled,
  });

  const [enableBetaRelease, setEnableBetaRelease] = useState(!!info.enableBetaRelease);

  useEffect(() => {
    let w = '';
    if (
      formState.isDirty || // eslint-disable-line
      autoUpgrade !== info.autoUpgrade || // eslint-disable-line
      enableWelcomePage !== !!info.enableWelcomePage ||
      fileSystemIsolationState.enableFileSystemIsolation !== !!info.enableFileSystemIsolation
    ) {
      w = t('setting.unSavedTip');
    }
    setWarning(w);
  }, [t, info, autoUpgrade, enableWelcomePage, fileSystemIsolationState.enableFileSystemIsolation, formState]);

  useAsyncEffect(async () => {
    try {
      const res = Object.assign({}, (await api.getNodeEnv()) || {});
      const { version } = res.info.blockletEngines.find(x => x.name === 'node');
      setNodeVersion(version);
    } catch (err) {
      console.error(err);
      Toast.error(err.message);
    }
  }, [api]);

  useEffect(() => {
    try {
      fileSystemIsolationState.enableFileSystemIsolation = !!info.enableFileSystemIsolation;
      fileSystemIsolationState.tooltip = t('setting.form.security.switchTips');
      fileSystemIsolationState.loading = isEmpty(nodeVersion);

      if (!isEmpty(nodeVersion) && !canUseFileSystemIsolateApi(nodeVersion)) {
        fileSystemIsolationState.tooltip = t('setting.form.security.warningTips', { version: nodeVersion });
      }
    } catch (err) {
      console.error(err);
      Toast.error(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.enableFileSystemIsolation, nodeVersion]);

  const onSubmit = async data => {
    setError('');
    setLoading(true);
    try {
      const result = await api.updateNodeInfo({
        input: {
          ...data,
          name: data.name.trim(),
          description: data.description.trim(),
          registerUrl: data.registerUrl.trim(),
          webWalletUrl: data.webWalletUrl.trim(),
          diskAlertThreshold: data.diskAlertThreshold,
          autoUpgrade,
          enableWelcomePage,
          enableFileSystemIsolation: fileSystemIsolationState.enableFileSystemIsolation,
          enableBetaRelease,
          enableDocker: dockerState.enableDocker,
          enableDockerNetwork: dockerState.enableDockerNetwork,
        },
      });
      await sleep(1000);

      reset(initDefaultValues(result.info));

      if (typeof onSaved === 'function') {
        onSaved(result);
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const { errors } = formState;

  return (
    <Div {...rest}>
      <Form noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        {!!title && (
          <Typography component="h2" variant="h5" className="stepper-tip">
            {title}
          </Typography>
        )}
        <Permission permission="mutate_node">
          {hasPermission => (
            <>
              <Controller
                name="name"
                control={control}
                rules={{ validate: value => !!value.trim() || t('setting.form.nameRequired') }}
                render={({ field }) => (
                  <TextField
                    variant="outlined"
                    label={t('setting.form.name')}
                    placeholder={t('setting.form.namePlaceholder')}
                    disabled={loading || !hasPermission}
                    data-cy="node-name-input"
                    error={errors.name && !!errors.name.message}
                    helperText={errors.name ? errors.name.message : ''}
                    margin="normal"
                    {...field}
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                rules={{ validate: value => !!value.trim() || t('setting.form.descriptionRequired') }}
                render={({ field }) => (
                  <TextField
                    variant="outlined"
                    label={t('setting.form.description')}
                    placeholder={t('setting.form.descriptionHolder')}
                    disabled={loading || !hasPermission}
                    data-cy="node-description-input"
                    error={errors.description && !!errors.description.message}
                    helperText={errors.description ? errors.description.message : ''}
                    margin="normal"
                    {...field}
                  />
                )}
              />
              <Controller
                name="registerUrl"
                control={control}
                rules={{}}
                render={({ field }) => (
                  <TextField
                    variant="outlined"
                    label={t('setting.form.registerUrl')}
                    placeholder={t('setting.form.registerUrlPlaceholder')}
                    disabled={loading || !hasPermission}
                    error={errors.registerUrl && !!errors.registerUrl.message}
                    helperText={errors.registerUrl ? errors.registerUrl.message : ''}
                    margin="normal"
                    {...field}
                  />
                )}
              />
              <Controller
                name="nftDomainUrl"
                control={control}
                rules={{}}
                render={({ field }) => (
                  <TextField
                    variant="outlined"
                    label={t('setting.form.nftDomainUrl')}
                    placeholder={t('setting.form.nftDomainUrlPlaceholder')}
                    disabled={loading || !hasPermission}
                    error={errors.nftDomainUrl && !!errors.nftDomainUrl.message}
                    helperText={errors.nftDomainUrl ? errors.nftDomainUrl.message : ''}
                    margin="normal"
                    {...field}
                  />
                )}
              />
              <Controller
                name="webWalletUrl"
                control={control}
                rules={{}}
                render={({ field }) => (
                  <TextField
                    variant="outlined"
                    label={t('setting.form.webWalletUrl')}
                    placeholder={t('setting.form.webWalletUrlPlaceholder')}
                    disabled={loading || !hasPermission}
                    error={errors.webWalletUrl && !!errors.webWalletUrl.message}
                    helperText={errors.webWalletUrl ? errors.webWalletUrl.message : ''}
                    margin="normal"
                    {...field}
                  />
                )}
              />
              <Controller
                name="diskAlertThreshold"
                control={control}
                rules={{}}
                render={({ field }) => (
                  <TextField
                    type="number"
                    variant="outlined"
                    label={t('setting.form.monitor.diskThreshold')}
                    placeholder={t('setting.form.monitor.diskThresholdPlaceholder')}
                    disabled={loading || !hasPermission}
                    error={errors.diskAlertThreshold && !!errors.diskAlertThreshold.message}
                    helperText={errors.diskAlertThreshold ? errors.diskAlertThreshold.message : ''}
                    margin="normal"
                    {...field}
                    slotProps={{
                      htmlInput: { min: 1, max: 99 },
                    }}
                  />
                )}
              />

              <SwitchControl
                checked={autoUpgrade}
                onChange={() => setAutoUpgrade(!autoUpgrade)}
                name="autoUpgrade"
                disabled={!hasPermission}
                labelProps={{
                  label: (
                    <Typography>
                      <span>{t('setting.form.upgrade.switchLabel')}</span>
                    </Typography>
                  ),
                }}
                style={{ marginTop: 20 }}
              />

              {autoUpgrade && (
                <SwitchControl
                  checked={enableBetaRelease}
                  onChange={() => setEnableBetaRelease(!enableBetaRelease)}
                  name="enableBetaRelease"
                  disabled={!hasPermission}
                  labelProps={{
                    label: (
                      <Typography>
                        <span>{t('setting.form.upgrade.enableBetaRelease')}</span>
                      </Typography>
                    ),
                  }}
                  style={{ marginTop: 20 }}
                />
              )}

              {info?.mode !== NODE_MODES.SERVERLESS && (
                <SwitchControl
                  checked={enableWelcomePage}
                  onChange={() => setEnableWelcomePage(!enableWelcomePage)}
                  name="enableWelcomePage"
                  disabled={!hasPermission}
                  labelProps={{
                    label: (
                      <Typography>
                        <span>{t('setting.form.welcome.switchLabel')}</span>
                      </Typography>
                    ),
                  }}
                  style={{ marginTop: 16 }}
                />
              )}

              <Controller
                name="enableSessionHardening"
                control={control}
                render={({ field }) => {
                  return (
                    <SwitchControl
                      checked={field.value}
                      disabled={loading || !hasPermission}
                      labelProps={{
                        label: (
                          <Typography>
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                              {t('setting.form.enableSessionHardening.switchLabel')}
                              <Tooltip title={t('setting.form.enableSessionHardening.switchTips')}>
                                <InfoOutlinedIcon sx={{ ml: 0.5, fontSize: '20px' }} color="primary" />
                              </Tooltip>
                            </span>
                          </Typography>
                        ),
                      }}
                      style={{ marginTop: 16 }}
                      {...field}
                    />
                  );
                }}
              />

              <SwitchControl
                checked={fileSystemIsolationState.enableFileSystemIsolation}
                onChange={() => {
                  fileSystemIsolationState.enableFileSystemIsolation =
                    !fileSystemIsolationState.enableFileSystemIsolation;
                  if (dockerState.enableDocker && fileSystemIsolationState.enableFileSystemIsolation) {
                    dockerState.enableDocker = false;
                    Toast.info(t('setting.form.docker.needCloseFileSystemIsolation'));
                  }
                }}
                name="enableFileSystemIsolation"
                disabled={!hasPermission}
                data-cy="file-system-isolation-switch"
                labelProps={{
                  label: (
                    <Typography>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {t('setting.form.security.switchLabel')}
                        <Tooltip title={!fileSystemIsolationState.loading && fileSystemIsolationState.tooltip}>
                          {fileSystemIsolationState.loading ? (
                            <Spinner size={14} sx={{ ml: 0.5 }} />
                          ) : (
                            <InfoOutlinedIcon sx={{ ml: 0.5, fontSize: '20px' }} color="primary" />
                          )}
                        </Tooltip>
                      </span>
                    </Typography>
                  ),
                }}
                style={{ marginTop: 16 }}
              />
              <SwitchControl
                checked={dockerState.enableDocker}
                onChange={() => {
                  if (!dockerState.enableDocker && !dockerState.isDockerInstalled) {
                    Toast.error(t('setting.form.docker.notInstalled'));
                    return;
                  }
                  dockerState.enableDocker = !dockerState.enableDocker;
                  if (dockerState.enableDocker && fileSystemIsolationState.enableFileSystemIsolation) {
                    fileSystemIsolationState.enableFileSystemIsolation = false;
                    Toast.info(t('setting.form.docker.needCloseFileSystemIsolation'));
                  }
                  if (!dockerState.enableDocker && dockerState.enableDockerNetwork) {
                    dockerState.enableDockerNetwork = false;
                  }
                }}
                name="enableDocker"
                disabled={!hasPermission}
                data-cy="docker-switch"
                labelProps={{
                  label: (
                    <Typography>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {t('setting.form.docker.switchLabel')}
                        <Tooltip title={!dockerState.loading && dockerState.tooltip}>
                          {dockerState.loading ? (
                            <Spinner size={14} sx={{ ml: 0.5 }} />
                          ) : (
                            <InfoOutlinedIcon sx={{ ml: 0.5, fontSize: '20px' }} color="primary" />
                          )}
                        </Tooltip>
                      </span>
                    </Typography>
                  ),
                }}
                style={{ marginTop: 16 }}
              />
              <SwitchControl
                checked={dockerState.enableDockerNetwork}
                onChange={() => {
                  if (!dockerState.enableDockerNetwork && !dockerState.isDockerInstalled) {
                    Toast.error(t('setting.form.docker.notInstalled'));
                    return;
                  }
                  dockerState.enableDockerNetwork = !dockerState.enableDockerNetwork;
                  if (dockerState.enableDockerNetwork && !dockerState.enableDocker) {
                    dockerState.enableDocker = true;
                  }
                }}
                name="enableDockerNetwork"
                disabled={!hasPermission}
                data-cy="docker-network-switch"
                labelProps={{
                  label: (
                    <Typography>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {t('setting.form.dockerNetwork.switchLabel')}
                        <Tooltip title={!dockerState.loading && t('setting.form.dockerNetwork.switchTips')}>
                          {dockerState.loading ? (
                            <Spinner size={14} sx={{ ml: 0.5 }} />
                          ) : (
                            <InfoOutlinedIcon sx={{ ml: 0.5, fontSize: '20px' }} color="primary" />
                          )}
                        </Tooltip>
                      </span>
                    </Typography>
                  ),
                }}
                style={{ marginTop: 16 }}
              />
            </>
          )}
        </Permission>

        {!!warning && <Alert severity="warning">{warning}</Alert>}
        <div className="form-actions">
          <Permission permission="mutate_node">
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={disabled || loading}
              color="primary"
              variant="contained"
              data-cy="submit-btn"
              className="form-submit">
              {submit} {loading ? <Spinner size={16} sx={{ ml: 1 }} /> : null}
            </Button>
          </Permission>
        </div>
        {!!error && (
          <Alert severity="error" error={error}>
            {error}
          </Alert>
        )}
      </Form>
      {warning && <LeavePagePrompt confirm={t('setting.unSavedLeaveTip')} />}
    </Div>
  );
}

BasicSetting.propTypes = {
  onSaved: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  title: PropTypes.string.isRequired,
  submit: PropTypes.string.isRequired,
};

const Div = styled.div`
  display: flex;
  align-items: flex-start;
  width: 100%;
  max-width: 720px;
`;
