import { useState, forwardRef, useImperativeHandle, useContext, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Typography,
  Tooltip,
  Link,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  HelpOutline,
  Link as LinkIcon,
  TaskAltOutlined,
  ErrorOutline,
} from '@mui/icons-material';
import styled from '@emotion/styled';
import { useCreation, useMemoizedFn, useReactive, useUnmount } from 'ahooks';
import isURL from 'validator/lib/isURL';
import { useConfirm } from '@arcblock/ux/lib/Dialog';
import Toast from '@arcblock/ux/lib/Toast';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Divider from '@mui/material/Divider';
import { getDisplayName } from '@blocklet/meta/lib/util';
import { Icon } from '@iconify/react';
import { getOriginUrl } from '@abtnode/util/lib/url-evaluation';

import Section from '../../component/section';
import FormSelectInput from '../../form/form-select-input';
import FormTextInput from '../../form/form-text-input';
import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';
import usePromiseWindowOpen from '../../hooks/use-promise-window-open';
import { formatError } from '../../util';
import { waitGetConnectedAigne, clearTimerByKey } from '../publish/utils/wait-connect';
import { decryptValue, encryptValue, isAigneHubProvider, isBedrockProvider, getEmptyFields } from './utils';
import { getAllProviders } from './use-model-data';
import UserCreditCard from './components/user-credit-card';
import Connected from './components/connected';
import { CardWrapper } from './components/basic';

const HIDE_MODEL_NAME = true;

function Description({ desc, docLink = null, provider = '', orientation = 'vertical' }) {
  const { t } = useContext(LocaleContext);
  return (
    <Typography
      variant="body2"
      sx={{
        lineHeight: 1.6,
        color: 'text.secondary',
        fontSize: 12,
        ...(orientation === 'vertical' && {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }),
      }}
      title={desc}>
      {desc}
      {docLink && (
        <Tooltip
          title={
            <>
              {t('setting.aigne.desc.docLink')}
              {docLink && (
                <>
                  :{' '}
                  <Link href={docLink} target="_blank" rel="noopener noreferrer" sx={{ ml: 0.5 }}>
                    {provider || 'documentation'}
                  </Link>
                </>
              )}
            </>
          }
          arrow>
          <HelpOutline fontSize="small" sx={{ ml: 0.25, fontSize: 14, cursor: 'pointer', verticalAlign: 'middle' }} />
        </Tooltip>
      )}
    </Typography>
  );
}

const initialValidation = {
  provider: '',
  model: '',
  url: '',
  key: '',
  accessKeyId: '',
  testConnection: '',
};

Description.propTypes = {
  desc: PropTypes.string.isRequired,
  docLink: PropTypes.string,
  provider: PropTypes.string,
  orientation: PropTypes.oneOf(['vertical', 'horizontal']),
};

function AigneConfig(
  { orientation = 'vertical', hideDivider = false, source = 'dashboard', forceValidate = false },
  ref
) {
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useContext(LocaleContext);
  const node = useNodeContext();
  const { api } = node;
  const { did, blocklet, actions } = useBlockletContext();
  const [isEdited, setIsEdited] = useState(false);
  const validation = useReactive({ ...initialValidation });
  const verifyState = useReactive({
    loading: false,
    success: false,
  });
  const { confirmApi, confirmHolder } = useConfirm();
  const timerKey = useMemo(() => `connect-aigne-${did}`, [did]);

  const modelGroups = getAllProviders(node);

  const openWindow = usePromiseWindowOpen({
    messageType: 'connect-aigne-message',
    onOpen: () => setLoading(true),
    onClose: () => setLoading(false),
  });

  const disabled = useMemo(() => {
    return loading || authLoading || disconnectLoading || verifyState.loading;
  }, [loading, authLoading, disconnectLoading, verifyState.loading]);

  const getProvider = useMemoizedFn((provider) => {
    return modelGroups.find((g) => g.provider === provider);
  }, []);
  // 根据 provider 获取对应的 models
  const getModelsByProvider = useMemoizedFn(
    (provider) => {
      const providerData = getProvider(provider);
      return providerData?.models || [];
    },
    [getProvider]
  );

  useUnmount(() => {
    if (timerKey) {
      clearTimerByKey(timerKey);
    }
  });

  // 获取默认模型名称
  const getDefaultModelName = useMemoizedFn(
    (initialModel) => {
      if (initialModel) {
        return initialModel;
      }

      const defaultAdapter = modelGroups[0]?.provider;
      const availableModels = getModelsByProvider(defaultAdapter);
      return availableModels[0]?.name || 'auto';
    },
    [getModelsByProvider]
  );

  const clearValidations = useMemoizedFn(() => {
    Object.keys(initialValidation).forEach((key) => {
      validation[key] = initialValidation[key];
    });
  });

  const aigneSettings = useCreation(() => {
    const { aigne = {} } = blocklet?.settings || {};
    return aigne;
  }, [blocklet]);

  const initialValues = useCreation(() => {
    const aigne = { ...aigneSettings };
    const defaultProvider = aigne?.provider || modelGroups[0]?.provider;

    const provider = getProvider(defaultProvider);
    const isAigneHub = isAigneHubProvider(defaultProvider);
    const isBedrock = isBedrockProvider(defaultProvider);

    const defaultValues = {
      ...aigne,
      url: getOriginUrl(aigne?.url || (isAigneHub ? provider?.baseURL || '' : '')),
      provider: defaultProvider,
      model: getDefaultModelName(aigne?.model),
      key: decryptValue(aigne?.key, did),
      accessKeyId: isBedrock ? decryptValue(aigne?.accessKeyId, did) : aigne?.accessKeyId,
      secretAccessKey: isBedrock ? decryptValue(aigne?.secretAccessKey, did) : aigne?.secretAccessKey,
    };

    return defaultValues;
  }, [blocklet, getProvider, getDefaultModelName]);

  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  // 检测是否授权成功
  const authSuccess = useMemo(() => {
    return values?.url && values?.key && values?.provider === 'aigneHub';
  }, [values]);

  const providerName = useCreation(() => {
    const provider = getProvider(values.provider);
    return provider?.name || values.provider;
  }, [values, getProvider]);

  const emptyFields = useMemo(() => {
    return getEmptyFields(values);
  }, [values]);

  // 获取 provider 文档
  const providerDoc = useCreation(() => {
    const provider = getProvider(values.provider);
    return provider?.documentation || '';
  }, [values, getProvider]);

  const handleRestartBlocklet = async () => {
    try {
      setLoading(true);
      const needRestartStatus = new Set(['running', 'error']);
      const componentDids = blocklet.children
        .filter((x) => needRestartStatus.has(x.status) || needRestartStatus.has(x.greenStatus))
        .map((x) => x.meta.did);
      await api.restartBlocklet({
        input: {
          did,
          componentDids,
        },
      });
      actions.refreshBlocklet();
    } catch (error) {
      console.error('error', error);
      Toast.error(formatError(error));
    } finally {
      setLoading(false);
    }
  };

  // 显示重启提示框
  const showRestartConfirm = (connected = true) => {
    // 如果是 setup 模式，则不显示重启提示框
    if (source === 'setup') {
      return undefined;
    }
    return new Promise((resolve) => {
      confirmApi.open({
        title: t('setting.aigne.restart.title'),
        content: connected
          ? t('setting.aigne.restart.connectedContent', { provider: providerName })
          : t('setting.aigne.restart.notConnectedContent', { provider: providerName }),
        confirmButtonText: t('setting.aigne.restart.confirm'),
        cancelButtonText: t('setting.aigne.restart.cancel'),
        onConfirm(close) {
          close();
          handleRestartBlocklet();
          resolve(true);
        },
        onCancel() {
          resolve(false);
        },
      });
    });
  };

  const revokeAuth = useMemoizedFn(() => {
    return new Promise((resolve) => {
      confirmApi.open({
        title: t('setting.aigne.revokeUrlAuthTitle', { url: t('setting.aigne.baseUrl', { provider: providerName }) }),
        content: t('setting.aigne.revokeUrlAuth', { url: t('setting.aigne.baseUrl', { provider: providerName }) }),
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        onConfirm(close) {
          // 确认逻辑
          close();
          resolve(true);
        },
        onCancel() {
          resolve(false);
        },
      });
    });
  });

  const handleFieldChange = async (field, value) => {
    const rest = {};
    setValues({ ...values, [field]: value });
    if (field === 'provider') {
      const availableModels = getModelsByProvider(value);
      if (availableModels.length > 0) {
        rest.model = availableModels[0].name;
      }
      rest.key = '';
      // 先取消默认 url 的赋值，因为只有一个 provider，不会发生改变
      // FIXED: 每一个 provider 都应该有自己的 url, 目前每次切换 provider 时，清空 url
      // const isAigneHub = isAigneHubProvider(value);
      // const provider = getProvider(value);
      // eslint-disable-next-line no-nested-ternary
      // rest.url = isAigneHub ? provider?.baseURL || '' : value === initialValues.provider ? initialValues.url : '';
    }
    if (authSuccess && field === 'url' && value !== values.url) {
      const confirmed = await revokeAuth();
      if (confirmed) {
        rest.key = '';
        rest.validationResult = '';
      } else {
        rest.url = values.url;
      }
    }
    // FIXED: @LiuShuang 避免受控组件由于上面的 await 导致数据更新缓慢的问题
    setTimeout(() => {
      setValues({ ...values, [field]: value, ...rest });
    }, 100);
    setIsEdited(true);
    return true;
  };

  const selectedAdapter = useMemo(() => values.provider, [values.provider]);
  const validateUrl = useMemoizedFn(
    (url) => {
      if (!isURL(url)) {
        return t('setting.aigne.invalidUrl', { provider: providerName });
      }
      return '';
    },
    [providerName]
  );

  const handleValidate = (skipFields = []) => {
    // 必填项进行校验
    const checkFields = emptyFields.filter((k) => !skipFields.includes(k));
    if (checkFields.length) {
      checkFields.forEach((field) => {
        validation[field] = 'required';
      });
      if (!checkFields.includes('url') && isAigneHubProvider(values.provider)) {
        validation.url = validateUrl(values.url);
      }
      return false;
    }
    // 规则校验
    const invalidUrl = isAigneHubProvider(values.provider) && validateUrl(values.url);
    if (invalidUrl) {
      validation.url = invalidUrl;
      return false;
    }
    return true;
  };

  // 取消 AIGNE Hub 授权
  const handleDisconnectConfirm = async () => {
    try {
      setDisconnectLoading(true);

      // 清除 aigne 配置
      await api.disconnectToAigne({
        input: {
          did,
          url: values.url,
          key: values.key,
        },
      });

      setIsEdited(false);

      Toast.success(t('setting.aigne.disconnectSuccess'));

      setTimeout(() => {
        showRestartConfirm(false);
      }, 300);
    } catch (error) {
      console.error('disconnect error:', error);
      Toast.error(formatError(error) || t('setting.aigne.disconnectFailed'));
    } finally {
      setDisconnectLoading(false);
    }
  };

  // 打开取消授权确认框
  const handleDisconnectClick = () => {
    confirmApi.open({
      title: t('setting.aigne.disconnect'),
      content: t('setting.aigne.disconnectConfirm'),
      confirmButtonText: t('setting.aigne.disconnect'),
      cancelButtonText: t('common.cancel'),
      onConfirm(close) {
        close();
        handleDisconnectConfirm();
      },
    });
  };

  const handleSubmit = async () => {
    if (!handleValidate()) {
      return undefined;
    }
    // 重置验证状态为初始值
    clearValidations();
    // 对敏感数据进行加密
    const encryptedData = { ...values, model: 'auto', key: encryptValue(values.key, did) }; // FIXME: @LiuShuang 这里兼容历史数据，先不保存 modal 数据

    if (isBedrockProvider(encryptedData.provider)) {
      encryptedData.key = '';
      if (values.accessKeyId) {
        encryptedData.accessKeyId = encryptValue(values.accessKeyId, did);
      }
      if (values.secretAccessKey) {
        encryptedData.secretAccessKey = encryptValue(values.secretAccessKey, did);
      }
    } else {
      // 清理数据，排除其他字段
      encryptedData.accessKeyId = '';
      encryptedData.secretAccessKey = '';
    }

    const res = await api.updateBlockletSettings({
      input: {
        did,
        aigne: encryptedData,
      },
    });
    actions.refreshBlocklet();
    return res;
  };

  const onSubmit = async () => {
    try {
      // 如果未编辑，则不进行校验
      // 如果开启了强制校验，在未编辑下，也进行校验
      if (!isEdited && !forceValidate) {
        return undefined;
      }
      setLoading(true);
      const res = await handleSubmit();
      if (!res) {
        return undefined;
      }
      setIsEdited(false);
      Toast.success(t('common.saveSuccess'));
      return res;
    } catch (error) {
      console.error('error', error);
      Toast.error(formatError(error) || t('setting.aigne.failed'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const onVerifyConnection = async (skipSave = false) => {
    validation.testConnection = '';
    try {
      verifyState.loading = true;
      if (!skipSave) {
        const savedResponse = await handleSubmit();
        if (savedResponse?.code !== 'ok') {
          return;
        }
      }

      await api.verifyAigneConnection({
        input: {
          did,
        },
      });
      Toast.success(t('setting.aigne.testSuccess', { provider: providerName }));
      verifyState.success = true;
    } catch (error) {
      console.error('error', error);
      validation.testConnection = error.message;
      Toast.error(t('setting.aigne.testFailed'));
      throw error;
    } finally {
      verifyState.loading = false;
      actions.refreshBlocklet();
    }
  };

  const onConnectToAigne = async () => {
    try {
      await waitGetConnectedAigne(api, {
        did,
        refresh: actions.refreshBlocklet,
        t,
        providerName,
        timerKey,
        values: { ...aigneSettings },
      })
        .catch((error) => {
          console.error('waitGetConnectedAigne error', error);
          Toast.error(formatError(error));
          throw error;
        })
        .then(() =>
          onVerifyConnection(true).catch((error) => {
            console.error('onVerifyConnection error', error);
            throw error;
          })
        );

      showRestartConfirm(true);
    } catch (error) {
      console.error('error', error);
    } finally {
      setIsEdited(false);
    }
  };

  // AIGNE Hub 授权
  const handleAIKitAuth = () => {
    if (!handleValidate(['key'])) {
      return;
    }
    clearValidations();
    openWindow(async (_, open) => {
      try {
        setAuthLoading(true);
        const res = await api.connectToAigne({
          input: {
            did,
            baseUrl: getOriginUrl(values.url || new URL(window.location.origin).origin),
            provider: values.provider,
            model: 'auto', // FIXME: @LiuShuang 这里兼容历史数据，先不保存 modal 数据
          },
        });

        if (!res?.url) {
          Toast.error('failed to connect to endpoint');
          setAuthLoading(false);
          setLoading(false);
          return;
        }

        open(res.url);
        await onConnectToAigne();
        setAuthLoading(false);
      } catch (err) {
        const error = formatError(err);
        Toast.error(error);
        setAuthLoading(false);
      }
    });
  };

  useImperativeHandle(ref, () => ({
    onSubmit,
    loading: loading || authLoading || disconnectLoading,
  }));

  const availableModels = getModelsByProvider(selectedAdapter);
  const isAIKit = selectedAdapter === 'aigneHub';

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const validationErrorMessage = useMemo(() => {
    if (validation.url === 'required') {
      return t('common.requiredErrorText', { name: t('setting.aigne.baseUrl', { provider: providerName }) });
    }
    if (validation.url) {
      return validation.url;
    }
    if (validation.key === 'required') {
      return t('setting.aigne.apiKeyNotAuthorized', { provider: providerName });
    }

    return '';
  }, [validation.url, validation.key, t, providerName]);

  return (
    <Wrapper source={source}>
      <Typography variant="h5" sx={{ fontSize: 18 }}>
        {t('setting.aigne.authorizeAigneHub', { name: providerName })}
      </Typography>
      {authSuccess && !!values.validationResult ? (
        <Connected
          url={values.url}
          providerName={providerName}
          disconnect={handleDisconnectClick}
          validationResult={values.validationResult}
          disabled={disabled}
          loading={disconnectLoading}
        />
      ) : (
        <CardWrapper height="none" minHeight="none">
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <Section
              orientation={orientation}
              title={t('setting.aigne.baseUrl', { provider: providerName })}
              required={isAigneHubProvider(values.provider)}
              desc={<Description desc={t('setting.aigne.desc.baseUrl', { example: 'https://hub.aigne.io' })} />}>
              <FormTextInput
                disabled={disabled}
                initialValue={values.url || ''}
                directEditing
                onSubmit={(value) => {
                  handleFieldChange('url', value);
                }}
                autoFocus={false}
                errorTips={validationErrorMessage}
                InputProps={
                  authSuccess
                    ? {
                        endAdornment: (
                          <InputAdornment position="end">
                            {verifyState.loading || authLoading ? (
                              <CircularProgress size={16} />
                            ) : (
                              <>
                                {values.validationResult === 'success' ? (
                                  <Tooltip title={t('setting.aigne.testSuccess', { provider: providerName })}>
                                    <TaskAltOutlined sx={{ fontSize: 16, color: 'success.main', cursor: 'pointer' }} />
                                  </Tooltip>
                                ) : null}
                                {values.validationResult && values.validationResult !== 'success' ? (
                                  <Tooltip title={values.validationResult}>
                                    <ErrorOutline sx={{ fontSize: 16, color: 'error.main', cursor: 'pointer' }} />
                                  </Tooltip>
                                ) : null}
                                {!values.validationResult ? (
                                  <IconButton aria-label="test connection" onClick={onVerifyConnection} edge="end">
                                    {verifyState.loading ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <Tooltip title={t('setting.aigne.testConnection', { provider: providerName })}>
                                        <Icon style={{ fontSize: 16 }} icon="tabler:location-check" />
                                      </Tooltip>
                                    )}
                                  </IconButton>
                                ) : null}
                              </>
                            )}
                          </InputAdornment>
                        ),
                      }
                    : {}
                }
              />
            </Section>
            <Button
              variant="contained"
              onClick={handleAIKitAuth}
              startIcon={authLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : <LinkIcon />}
              disabled={disabled || !values.url}
              sx={{
                flexShrink: 0,
              }}>
              {t('setting.aigne.authorizeAigneHub', { name: 'AIGNE Hub' })}
            </Button>
          </Box>
        </CardWrapper>
      )}

      {/* 以下都是先隐藏部分，后续再显示 */}
      <Grid container className="config-container" spacing={2} sx={{ display: 'none' }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Section
            orientation={orientation}
            title={t('setting.aigne.modelAdapter')}
            required
            desc={<Description desc={t('setting.aigne.desc.modelAdapter')} />}>
            <FormSelectInput
              disabled={disabled}
              options={modelGroups}
              config={{ multiple: false, labelField: 'name', valueField: 'provider' }}
              initialValue={values.provider}
              directEditing
              searchable={false}
              helperText={
                validation.provider === 'required'
                  ? t('common.requiredErrorText', { name: t('setting.aigne.modelAdapter') })
                  : validation.provider
              }
              onChange={(value) => handleFieldChange('provider', value)}
            />
          </Section>
        </Grid>

        {!HIDE_MODEL_NAME ? (
          <Section
            orientation={orientation}
            title={t('setting.aigne.modelName')}
            desc={<Description desc={t('setting.aigne.desc.modelName')} />}>
            <FormSelectInput
              disabled={disabled}
              options={availableModels}
              config={{ multiple: false, labelField: 'displayName', valueField: 'name' }}
              initialValue={values.model || ''}
              directEditing
              helperText={
                validation.model === 'required'
                  ? t('common.requiredErrorText', { name: t('setting.aigne.modelName') })
                  : validation.model
              }
              onChange={(value) => handleFieldChange('model', value)}
            />
          </Section>
        ) : null}

        {isAIKit ? null : (
          // eslint-disable-next-line react/jsx-no-useless-fragment
          <>
            {isBedrockProvider(values.provider) ? (
              <>
                <Section
                  orientation={orientation}
                  title="Access Key ID"
                  required
                  desc={
                    <Description
                      desc={t('setting.aigne.desc.accessKeyId')}
                      docLink={providerDoc}
                      provider={providerName}
                    />
                  }>
                  <FormTextInput
                    disabled={disabled}
                    initialValue={values.accessKeyId || ''}
                    type={showPassword ? 'text' : 'password'}
                    onChange={(value) => handleFieldChange('accessKeyId', value)}
                    directEditing
                    autoFocus={false}
                  />
                </Section>
                {!hideDivider && (
                  <Box
                    className="config-form"
                    component={Divider}
                    sx={{
                      my: 3,
                    }}
                  />
                )}
                <Section
                  orientation={orientation}
                  title="Secret Access Key"
                  required
                  desc={
                    <Description
                      desc={t('setting.aigne.desc.secretAccessKey')}
                      docLink={providerDoc}
                      provider={providerName}
                    />
                  }>
                  <FormTextInput
                    disabled={disabled}
                    initialValue={values.secretAccessKey || ''}
                    type={showPassword ? 'text' : 'password'}
                    onChange={(value) => handleFieldChange('secretAccessKey', value)}
                    directEditing
                    autoFocus={false}
                  />
                </Section>
              </>
            ) : (
              <Section
                orientation={orientation}
                title="API Key"
                required
                desc={
                  <Description
                    desc={t('setting.aigne.desc.key', { provider: providerName })}
                    docLink={providerDoc}
                    provider={providerName}
                  />
                }>
                <FormTextInput
                  disabled={disabled}
                  initialValue={values.key || ''}
                  type={showPassword ? 'text' : 'password'}
                  onChange={(value) => handleFieldChange('key', value)}
                  directEditing
                  autoFocus={false}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end">
                          {!showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Section>
            )}
          </>
        )}
      </Grid>

      {authSuccess && values.validationResult === 'success' ? (
        <UserCreditCard
          switchUser={handleAIKitAuth}
          url={values.url || ''}
          apiKey={values.key || ''}
          connecting={authLoading || disconnectLoading}
        />
      ) : null}
      {source !== 'setup' && (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 3, fontStyle: 'italic' }}>
          * {t('setting.aigne.description', { name: getDisplayName(blocklet, true) })}
        </Typography>
      )}
      {confirmHolder}
    </Wrapper>
  );
}

AigneConfig.propTypes = {
  orientation: PropTypes.oneOf(['vertical', 'horizontal']),
  hideDivider: PropTypes.bool,
  source: PropTypes.oneOf(['dashboard', 'setup']),
  forceValidate: PropTypes.bool,
};

const Wrapper = styled.div`
  max-width: 920px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  .section-title {
    line-height: 1.2 !important;
    font-weight: ${({ source }) => (source === 'setup' ? '400' : '500')};
    color: ${({ theme, source }) => (source === 'setup' ? theme.palette.text.secondary : theme.palette.text.primary)};
    font-size: ${({ source }) => (source === 'setup' ? '14px' : '16px')};
  }
  .section-left {
    width: 100%;
  }
  .form-item {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
  }
`;

export default forwardRef(AigneConfig);
