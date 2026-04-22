/* eslint-disable react/no-unstable-nested-components */
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { isInServerlessMode } from '@abtnode/util/lib/serverless';
import AnimationWaiter from '@arcblock/ux/lib/AnimationWaiter';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { BLOCKLET_APP_SPACE_REQUIREMENT, BLOCKLET_CONFIGURABLE_KEY, BlockletEvents } from '@blocklet/constant';
import { StepProvider } from '@blocklet/launcher-layout/lib/context/step';
import ResultMessage from '@blocklet/launcher-layout/lib/launch-result-message';
import PageHeader from '@blocklet/launcher-layout/lib/page-header';
import styled from '@emotion/styled';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Link';
import { Alert, Box, CircularProgress, TextField, Typography, useMediaQuery } from '@mui/material';
import flatten from 'lodash/flatten';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import uniqBy from 'lodash/uniqBy';
import { formatError } from '@blocklet/error';

import Toast from '@arcblock/ux/lib/Toast';
import { hasMountPoint } from '@blocklet/meta/lib/engine';
import { urlPathFriendly } from '@blocklet/meta/lib/url-path-friendly';
import { getDisplayName, getSharedConfigObj, hasStartEngine, isFreeBlocklet } from '@blocklet/meta/lib/util';

import { useBlockletContext } from '../../../contexts/blocklet';
import { ConfigSpaceProvider } from '../../../contexts/config-space';
import { useNodeContext } from '../../../contexts/node';
import useCanInstallWithDocker from '../../../contexts/use-can-install-with-docker';
import Required from '../../../form/required';
import SchemaForm from '../../../schema-form';
import { formatMountPoint, getBlockletMetaUrl, getStoreList, isNewStoreUrl } from '../../../util';
import Agreement from '../../agreement';
import InstallFromUrl from '../../install-from-url';
import { ComponentPurchaseSelect } from '../../purchase';
import { existPathPrefix, validatePathPrefix } from '../../router/util';
import DidSpace from '../did-space';
import SelectStore from '../select-store';
import BlockletList from '../store-blocklet-list';
import StepContent from './step-connect';
import AigneConfig from '../../aigne-config/config';

const getSameMountPointMeta = (blocklet, mountPoint) => {
  return (blocklet?.children || []).find((x) => x.mountPoint === mountPoint)?.meta;
};

const requirePurchase = (meta) => meta.inStore && isFreeBlocklet(meta) === false;
const isRequiredOnSetup = (meta) => {
  return [BLOCKLET_APP_SPACE_REQUIREMENT.REQUIRED, BLOCKLET_APP_SPACE_REQUIREMENT.REQUIRED_ON_SETUP].includes(
    meta?.capabilities?.didSpace
  );
};
/**
 * @description
 * @param {import('@blocklet/server-js').BlockletState} blocklet
 * @return {string}
 */
const getDIDSpaceEndpoint = (blocklet) => {
  return (
    blocklet?.configs?.find((item) => item.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPACE_ENDPOINT)?.value || null
  );
};
const hasRequiredEnvironments = (meta) => (meta.environments || []).some((x) => x.required);
const hasMissRequiredConfigs = (configsList, sharedValueMap) => {
  return configsList?.some((item) => {
    return item.required && !sharedValueMap[item.key];
  });
};

const getConfirmText = ({ params, blocklet, t }) => {
  const name = params.title || params.name;
  if (!name) {
    return t('common.next');
  }
  const exist = (blocklet?.children || []).find((x) => x.meta.bundleDid === params.bundleDid);
  if (!exist) {
    return t('blocklet.component.addNext', { name });
  }

  return t('blocklet.component.upgradeNext', { name });
};

const postInstalledMessage = ({ componentDid, timeout = 1000, manual = false } = {}) => {
  // send event to parent window
  setTimeout(() => {
    window.parent.postMessage({ event: 'component.installed', componentDid, manual }, '*');
  }, timeout);
};

const getRegistryUrlByBundleSource = (bundleSource) => {
  if (bundleSource?.store) {
    return bundleSource.store;
  }
  return bundleSource?.url || '';
};

export default function AddComponentCore({
  onClose = () => {},
  mode = 'normal',
  stores = [],
  resourceType = '',
  resourceDid = '',
  storageKey = '',
  inDialog = true,
  selectedMeta = null,
  storeUrl = '',
  showResourcesSwitch = true,
  showFromUrl = true,
  enableRunBackground = true,
  showCategory = true,
  installFromUrlParams = null,
}) {
  const { t, locale } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [mountPointHelperText, setMountPointHelperText] = useState('');
  const {
    api,
    ws: { useSubscription },
    inService,
    info: nodeInfo,
  } = useNodeContext();
  const {
    blocklet,
    actions: { refreshBlocklet: refreshApp },
  } = useBlockletContext();
  const [purchaseData, setPurchaseData] = useState(null);
  const [isWaitingPurchase, setIsWaitingPurchase] = useState(false);
  const initParams = {
    bundleDid: '',
    componentDid: '',
    componentName: '',
    pathPrefix: '',
    name: '',
    title: '',
    configsList: [],
    configsValue: {},
    hasMissRequiredConfigs: false,
    hasEnvironmentsStep: false,
    hasRequiredEnvironments: false,
    requirePurchase: false,
    didSpaceIsRequiredSetup: null,
    installResultProps: {},
    purchaseResultProps: {},
    showFromUrlDialog: false,
    isUpload: false,
    upgradeDid: '',
  };
  const [params, setParams] = useState(initParams);
  const [activeStep, setActiveStep] = useState(0);
  const component = useRef({});
  const stepRef = useRef({});
  const purchaseRef = useRef({});
  const isMobile = useMediaQuery((_theme) => _theme.breakpoints.down('md'));
  const routerParams = useParams();
  const [installRelated, setInstallRelated] = useState(true);
  const { meta } = component.current;
  const dockerBlockletCanInstall = useCanInstallWithDocker(meta);
  const hasStartInstall = useRef(false);
  const formRef = useRef(null);

  const updateParams = (obj) => setParams((x) => ({ ...x, ...obj }));

  useEffect(() => {
    if (params.pathPrefix) {
      // eslint-disable-next-line no-use-before-define
      const { errMsg } = validateInput({ ...params, pathPrefix: params.pathPrefix, locale });
      setError(errMsg);
    }
  }, [params.pathPrefix]); // eslint-disable-line

  useEffect(() => {
    if (activeStep === 0) {
      // reset params, when step change to select component
      setParams(initParams);
    }
  }, [activeStep]); // eslint-disable-line

  const refreshDidSpaceEndpoint = () => {
    const didSpaceEndpoint = getDIDSpaceEndpoint(blocklet) ?? '';

    updateParams({
      didSpaceEndpoint,
    });
  };

  const getComponentName = () => {
    if (component?.current?.meta) {
      return getDisplayName(component.current);
    }
    return '';
  };

  const onOver = () => {
    setLoading(false);
    setParams({});
    hasStartInstall.current = false;
    component.current = {};
    onClose();
  };

  const setInstallErrorResult = (errorMessage) => {
    const update = (_loading) => {
      updateParams({
        installResultProps: {
          variant: 'error',
          title: getComponentName(),
          subTitle: errorMessage,
          footer: (
            <Button
              className="bottom-button"
              disabled={_loading}
              data-cy="retry-install-component"
              onClick={async () => {
                // set button disabled and show spinner
                update(true);
                // eslint-disable-next-line no-use-before-define
                await onInstall(component.current.installInput);
              }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}>
                {_loading && <CircularProgress size={16} style={{ marginRight: 8 }} />}
                {t('common.retry')}
              </Box>
            </Button>
          ),
        },
      });
    };
    update();
  };

  const createBlockletEventHandler = (handler) => {
    return (b) => {
      if ((b?.meta?.did || b?.meta) === blocklet?.meta?.did) {
        handler(b);
      }
    };
  };

  const onFinish = () => {
    postInstalledMessage({
      timeout: 0,
      componentDid: routerParams.componentDid,
      manual: true,
    });
    onOver();
    // scroll to bottom
    setTimeout(() => {
      const scrollDom = document.getElementsByClassName('dashboard-main')[0];
      if (scrollDom) {
        scrollDom.scrollTop = scrollDom.scrollHeight;
      }
    }, 200);
  };

  useSubscription(
    BlockletEvents.componentInstalled,
    createBlockletEventHandler(() => {
      updateParams({
        installResultProps: {
          variant: 'success',
          title: getComponentName(),
          subTitle: t('blocklet.component.installSuccessTip'),
        },
      });
      postInstalledMessage({ componentDid: routerParams.componentDid });
    }),
    [blocklet?.meta?.did]
  );

  useSubscription(
    BlockletEvents.statusChange,
    createBlockletEventHandler(() => {
      const didSpaceEndpoint = getDIDSpaceEndpoint(blocklet);
      updateParams((p) => ({
        ...p,
        didSpaceEndpoint,
      }));
    }),
    [blocklet?.meta?.did]
  );

  useSubscription(
    BlockletEvents.downloadFailed,
    createBlockletEventHandler(() => {
      hasStartInstall.current = false;
      setInstallErrorResult(t('blocklet.component.installComponentError'));
    }),
    [blocklet?.meta?.did]
  );

  useSubscription(
    BlockletEvents.installFailed,
    createBlockletEventHandler(() => {
      hasStartInstall.current = false;
      setInstallErrorResult(t('blocklet.component.installComponentError'));
    }),
    [blocklet?.meta?.did]
  );

  const steps = [];

  const alreadyInstalled = (did) => (blocklet?.children || []).find((x) => x.meta.did === did);

  const onInstall = async (payload) => {
    hasStartInstall.current = true;
    const { pathPrefix: mountPoint, bundleDid, title, componentName = '', componentDid = '' } = params;
    // eslint-disable-next-line no-shadow
    const meta = component.current?.meta || {};
    const { configs = [], registryUrl, inStore, inputUrl, dist } = meta;
    const downloadTokenList = component.current?.downloadTokenList;
    const url = inputUrl || (inStore ? getBlockletMetaUrl(registryUrl, bundleDid, dist) : '');

    setLoading(true);

    const installInput = {
      rootDid: blocklet.meta.did,
      url,
      mountPoint: mountPoint ? urlPathFriendly(mountPoint) : `/${urlPathFriendly(meta.title || meta.name)}`,
      title,
      name: componentName,
      did: params.isUpload && !!params.upgradeDid ? params.upgradeDid : componentDid,
      dist: {
        tarball: '',
        integrity: '',
      },
      onlyRequired: !installRelated,
      // if blocklet has config, provide the configs
      ...(params.hasEnvironmentsStep && configs.length > 0
        ? {
            configs: configs.map((item) => {
              return {
                ...item,
                value: params.configsValue[item.key] || '',
              };
            }),
          }
        : {}),
      ...(downloadTokenList ? { downloadTokenList } : {}),
      ...payload,
    };

    try {
      await api.installComponent({
        input: installInput,
      });
      if (registryUrl) {
        const { teamDid, storeList } = getStoreList({ fromBlocklet: inService, nodeInfo, blocklet });
        const { isNew, decoded } = isNewStoreUrl(registryUrl, storeList);
        if (isNew) {
          api.addBlockletStore({ input: { teamDid, url: decoded } }).catch((err) => {
            console.error('addBlockletStore error: ', err);
          });
        }
      }
      updateParams({
        installResultProps: {},
      });

      // let app state refresh fast before receive subscribe event
      refreshApp({ showError: false, attachRuntimeInfo: false });
    } catch (err) {
      const errMsg = formatError(err);
      Toast.error(errMsg);
      console.error('installComponent error: ', err);
      setInstallErrorResult(errMsg);
    } finally {
      setLoading(false);
      component.current.installInput = installInput;
    }
  };

  const validateInput = (input) => {
    // FIXME: validatePathPrefix should be updated
    const result = validatePathPrefix({
      params: { ...input, did: input.bundleDid },
      blocklets: [blocklet],
      // blocklets: component.current?.blocklets?.map(x => ({ meta: x })) || [],
      blocklet,
      locale,
      isUpload: params.isUpload,
    });

    let errMsg = result;
    const sameMountPointMeta = getSameMountPointMeta(blocklet, params.pathPrefix);
    if (result === 'overwrite' && sameMountPointMeta && sameMountPointMeta.did !== input.bundleDid) {
      updateParams({
        upgradeDid: sameMountPointMeta.did,
      });
      errMsg = '';
    } else {
      updateParams({
        upgradeDid: '',
      });
      errMsg = result;
    }

    if (errMsg) {
      const installedBlocklet = alreadyInstalled(input.bundleDid);
      const existMountPoint = existPathPrefix({ params: { ...input, did: input.bundleDid }, blocklet });
      if (installedBlocklet && installedBlocklet.mountPoint === existMountPoint) {
        return { errMsg: '' };
      }
    }

    return { errMsg };
  };

  const onNext = async (payload) => {
    const { errMsg } = validateInput({ ...params, locale });
    setError(errMsg);

    // the step can complete, install component
    if (activeStep === steps.length - 2 && !hasStartInstall.current) {
      await onInstall(payload);
    }
    stepRef.current?.setActiveStepByIndex?.((x) => x + 1);
  };

  const onCancel = () => {
    stepRef.current?.setActiveStepByIndex?.((x) => x - 1);
  };

  const onGeneratePurchaseData = () => {
    const { pathPrefix: mountPoint, bundleDid, title, componentName = '', componentDid = '' } = params;

    // eslint-disable-next-line no-shadow
    const { meta = {} } = component.current || {};
    const { registryUrl, inStore, inputUrl, dist } = meta;
    const url = inStore ? getBlockletMetaUrl(registryUrl, bundleDid, dist) : inputUrl;

    setPurchaseData({
      meta,
      installOpts: {
        type: 'component',
        rootDid: blocklet.meta.did,
        mountPoint,
        url,
        title,
        name: componentName,
        did: componentDid,
      },
    });
  };

  const onCancelPurchase = (errorMessage) => {
    setIsWaitingPurchase(false);
    updateParams({
      purchaseResultProps: {
        variant: 'error',
        title: getComponentName(),
        subTitle: errorMessage,
        style: {
          paddingTop: 120,
        },
        footer: (
          <Button
            className="bottom-button"
            data-cy="retry-purchase-component"
            onClick={() => {
              updateParams({
                purchaseResultProps: {},
              });
            }}>
            {t('common.retry')}
          </Button>
        ),
      },
    });
  };

  const onSuccessPurchase = ({ downloadTokenList }) => {
    component.current.downloadTokenList = downloadTokenList;
    setIsWaitingPurchase(false);
    onNext();
  };

  const setConfigValue = ({
    chooseParams = component.current,
    componentDid: componentDidValue,
    isInit = false,
    isUpload = false,
  }) => {
    // eslint-disable-next-line no-shadow
    const { meta, registryUrl, inStore, inputUrl } = chooseParams;
    const { did: bundleDid, title, name } = meta;

    // deleted history list
    const deletedList = (blocklet.settings?.children || []).filter(
      (x) => x.status === 'deleted' && x.meta.bundleDid === bundleDid
    );

    const componentDid = componentDidValue || '';

    const newConfigs = meta.environments?.map((item) => {
      const { name: key, validation, ...rest } = item;
      const formatItem = {
        // if the blocklet has validation, provide the validation (fix not inStore)
        validation: isNil(validation) ? '' : validation,
      };

      return {
        ...rest,
        key,
        ...formatItem,
      };
    });

    component.current = {
      ...chooseParams,
      // FIXME: 此处不应该修改 meta 的结构，会导致在不同地方看到的 meta 结果不一样，然后产生误解
      meta: {
        ...meta,
        // init configs from environments
        configs: newConfigs,
        registryUrl,
        inStore,
        inputUrl,
      },
    };

    let doc = {};

    // if is init, should update configs
    if (isInit) {
      const ancestors = [blocklet];

      // component config
      const componentSelfConfigs = newConfigs || [];

      // TODO: meta not include children environments/configs before install, waiting for next sprint to design
      const componentChildrenConfigs = [];

      // eslint-disable-next-line
      // chooseBlocklet?.children?.map(childBlocklet => {
      //   // eslint-disable-next-line no-shadow
      //   forEachChildSync(childBlocklet, (b, { ancestors }) => {
      //     const ancestorDids = ancestors.slice(1).map(x => x.meta.did);

      //     componentChildrenConfigs.push(
      //       (b.configs || []).map(x => ({ ...x, childDid: ancestorDids.concat(b.meta.did) }))
      //     );
      //   });

      //   return false;
      // });

      const componentAllConfigs = uniqBy(flatten([...componentSelfConfigs, ...componentChildrenConfigs]), 'key')
        .filter((x) => !!x.key)
        .sort((a, b) => {
          if (a.required && !b.required) {
            return -1;
          }

          if (b.required && !a.required) {
            return 1;
          }

          return 0;
        });

      const sharedConfigObj = getSharedConfigObj(ancestors[0], {
        configs: componentAllConfigs,
      });

      const configsValue = {};

      const configsList = componentAllConfigs.map((item) => {
        const { default: defaultValue, key, ...rest } = item;
        configsValue[key] = sharedConfigObj[key] || defaultValue;
        return {
          ...rest,
          key,
          hidden: !!BLOCKLET_CONFIGURABLE_KEY[key],
        };
      });

      doc = {
        ...doc,
        configsList,
        configsValue,
        hasMissRequiredConfigs: hasMissRequiredConfigs(configsList, configsValue),
      };
    }

    const hasRootPath = blocklet.children.some((x) => x.mountPoint === '/');

    // use deleted history
    const deletedConfig = deletedList.find((x) => x.meta.bundleDid === bundleDid);
    const installedConfig = blocklet.children.find((x) => x.meta.bundleDid === bundleDid);

    doc.title = title || '';
    if (deletedConfig) {
      doc = {
        ...doc,
        pathPrefix: deletedConfig.mountPoint || '',
        componentName: deletedConfig.meta.name,
        // use history's environments
        hasEnvironmentsStep: false,
      };
    } else if (installedConfig) {
      doc = {
        ...doc,
        pathPrefix: installedConfig.mountPoint || '',
        componentName: installedConfig.meta.name,
        // use current's environments
        hasEnvironmentsStep: false,
      };
    } else {
      doc = {
        ...doc,
        pathPrefix: hasRootPath ? `/${urlPathFriendly(title) || urlPathFriendly(name)}`.toLowerCase() : '/',
        componentName: '',
        hasEnvironmentsStep: component.current.meta?.environments?.length > 0,
      };
    }

    // eslint-disable-next-line no-shadow
    const componentRequirePurchase = requirePurchase(component.current.meta);
    const componentDidSpaceIsRequiredSetup = isRequiredOnSetup(component.current.meta);
    const didSpaceEndpoint = getDIDSpaceEndpoint(blocklet);

    updateParams({
      bundleDid,
      componentDid,
      ...doc,
      hasRequiredEnvironments: hasRequiredEnvironments(component.current.meta),
      requirePurchase: componentRequirePurchase,
      didSpaceIsRequiredSetup: componentDidSpaceIsRequiredSetup,
      didSpaceEndpoint,
      isUpload,
    });

    if (isInit && componentRequirePurchase) {
      onGeneratePurchaseData();
    }
  };

  const onSubmitAigneConfig = async () => {
    if (formRef.current.loading) {
      return;
    }
    try {
      setLoading(true);
      const res = await formRef.current.onSubmit();
      if (res) {
        onNext();
      }
    } catch (e) {
      console.error('error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((!selectedMeta && !installFromUrlParams?.meta) || activeStep !== 0 || !blocklet) {
      return;
    }
    const {
      meta: installMeta,
      inputUrl = '',
      inStore = true,
      registryUrl = '',
      isUpload = false,
    } = installFromUrlParams || {};
    setConfigValue({
      chooseParams: {
        blocklets: [selectedMeta || installMeta],
        meta: selectedMeta || installMeta,
        registryUrl: registryUrl || storeUrl || getRegistryUrlByBundleSource(selectedMeta?.bundleSource),
        inStore,
        inputUrl,
      },
      isInit: true,
      isUpload,
    });
    updateParams({
      showFromUrlDialog: false,
    });
    onNext();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMeta, activeStep, blocklet, installFromUrlParams]);

  steps.push({
    key: 'selectComponent',
    name: t('blocklet.component.selectComponent'),
    body: (
      <TypographyWrapper sx={{ width: 400, display: 'flex', flexDirection: 'column' }} component="div">
        {showFromUrl && params.showFromUrlDialog && (
          <InstallFromUrl
            // if not set defaultUrl, the dialog will always show step 1 when the dialog is opened
            // defaultUrl={meta?.inputUrl}
            mode="component"
            onCancel={() => {
              updateParams({
                showFromUrlDialog: false,
              });
            }}
            // eslint-disable-next-line no-shadow
            onSuccess={({ meta, inputUrl, inStore, registryUrl }) => {
              setConfigValue({
                chooseParams: {
                  meta,
                  inputUrl,
                  inStore,
                  registryUrl,
                },
                isInit: true,
              });
              updateParams({
                showFromUrlDialog: false,
              });
              onNext();
            }}
            handleText={{
              title: t('blocklet.component.addComponentTip.fromUrl'),
              confirm: t('blocklet.component.choose'),
            }}
          />
        )}
        <SelectStore
          stores={stores}
          extra={
            // eslint-disable-next-line no-nested-ternary
            !isInServerlessMode(nodeInfo) ? (
              showFromUrl ? (
                <Button
                  variant="text"
                  color="primary"
                  data-cy="add-component-from-url"
                  onClick={() => {
                    updateParams({
                      showFromUrlDialog: true,
                    });
                  }}
                  style={{ padding: '0 2px' }}>
                  <AddIcon style={{ fontSize: 20, marginRight: 4 }} />
                  {t('blocklet.component.addComponentTip.fromUrl')}
                </Button>
              ) : null
            ) : null
          }
          loading={loading}
          onChange={() => {
            setParams({});
            component.current = {};
          }}
          storageKey={storageKey}>
          {({ currentRegistry }) => {
            return (
              <BlockletList
                showResourcesSwitch={showResourcesSwitch}
                showCategory={showCategory}
                serverVersion={nodeInfo?.version}
                compact
                style={{ flex: 1, overflow: 'hidden', height: '100%' }}
                storeUrl={currentRegistry.url}
                resourceType={resourceType}
                resourceDid={resourceDid}
                handleButtonClick={(chooseParams) => {
                  setConfigValue({
                    chooseParams: {
                      ...chooseParams,
                      inStore: true, // choose from store, must be inStore
                    },
                    isInit: true,
                  });
                }}
                handleBlockletRender={({ blocklet: blockletItem, defaultRender }) => {
                  const isChosen = params?.bundleDid && params?.bundleDid === blockletItem?.did;

                  return (
                    <StoreBlockletItemWrapper>
                      <Box
                        className={isChosen ? 'choose-blocklet' : ''}
                        sx={{
                          '& > div': {
                            position: 'relative',
                            '&:before, &:after': {
                              content: '""',
                              position: 'absolute',
                              width: '0',
                              height: '0',
                              opacity: 0,
                              transition: 'width 0.3s, height 0.3s, opacity 0.3s',
                              borderRadius: '8px',
                              pointerEvents: 'none',
                              ...(isChosen
                                ? {
                                    width: '100%',
                                    height: '100%',
                                    opacity: 1,
                                  }
                                : {}),
                            },
                            '&:before': {
                              top: 0,
                              left: 0,
                              borderTop: '1px solid',
                              borderLeft: '1px solid',
                              borderColor: 'primary.main',
                            },
                            '&:after': {
                              bottom: 0,
                              right: 0,
                              borderBottom: '1px solid',
                              borderRight: '1px solid',
                              borderColor: 'primary.main',
                            },
                            '&:hover': {
                              '&:before, &:after': {
                                width: '100%',
                                height: '100%',
                                opacity: 1,
                              },
                            },
                          },
                        }}
                        style={{
                          marginLeft: 16,
                        }}>
                        {defaultRender}
                      </Box>
                      {isChosen && (
                        <Box className="check-container">
                          <CheckIcon className="check-icon" />
                        </Box>
                      )}
                    </StoreBlockletItemWrapper>
                  );
                }}
              />
            );
          }}
        </SelectStore>
      </TypographyWrapper>
    ),
    cancel: mode === 'embed' ? undefined : t('common.cancel'),
    confirm: getConfirmText({ params, blocklet, t }),
    onCancel: onOver,
    onConfirm: () => {
      onNext();
    },
  });
  steps.push({
    key: 'agreement',
    name: t('launchBlocklet.introduction'),
    body: (
      // TODO: 添加要展示的信息，暂时无法添加，需要修改 launch-layout 里的组件
      <TypographyWrapper component="div" className="agreement-wrapper">
        <PageHeader
          title={t('launchBlocklet.introduction')}
          subTitle={t('blocklet.component.addComponentTip.introduction')}
        />
        {meta ? (
          <Agreement
            meta={meta}
            onClickNext={onNext}
            installRelated={installRelated}
            onChangeInstallRelated={setInstallRelated}
            handleDescEle={<p>{t('blocklet.component.addComponentTip.belowInformation')}</p>}
          />
        ) : null}
      </TypographyWrapper>
    ),
    cancel: selectedMeta ? undefined : t('common.pre'),
    disabled: !dockerBlockletCanInstall,
    confirm: dockerBlockletCanInstall ? t('launchBlocklet.next') : t('launchBlocklet.canNotInstall'),
    onCancel: selectedMeta ? onOver : onCancel,
    onConfirm: () => {
      setIsWaitingPurchase(false);
      onNext();
    },
  });
  if (meta && params.requirePurchase) {
    steps.push({
      key: 'purchase',
      name: (
        <>
          {t('common.verifyNFT')}
          <Required />
        </>
      ),
      body: (
        <TypographyWrapper
          component="div"
          className="flex-align-center"
          style={{
            flexDirection: 'column',
          }}>
          {!(purchaseRef.current?.getCurrentStep?.() === 2 || isWaitingPurchase) && (
            <PageHeaderWrapper
              title={t('common.verifyNFT')}
              subTitle={t('blocklet.component.addComponentTip.verifyNFT')}
            />
          )}
          {!isEmpty(params.purchaseResultProps) ? (
            <div className="flex-align-center flex-justify-center">
              <ResultMessage {...params.purchaseResultProps} />
            </div>
          ) : (
            purchaseData && (
              <ComponentPurchaseSelect
                ref={purchaseRef}
                meta={purchaseData.meta}
                // if select deleted history, use verify mode
                mode={params.componentDid ? 'verify' : 'both'}
                onCancel={onCancelPurchase}
                installOpts={purchaseData.installOpts}
                handlePaySuccess={onSuccessPurchase}
              />
            )
          )}
        </TypographyWrapper>
      ),
      disabled: purchaseRef.current?.getCurrentStep?.() === 2 || isWaitingPurchase,
      cancel: t('common.pre'),
      confirm: t('common.next'),
      onConfirm: () => {
        if (typeof purchaseRef.current.onNext === 'function') {
          purchaseRef.current.onNext();
          setIsWaitingPurchase(true);
        }
      },
      onCancel: () => {
        onCancel();
      },
    });
  }
  if (hasStartEngine(meta) && hasMountPoint(meta)) {
    steps.push({
      key: 'config',
      name: t('common.config'),
      error,
      body: (
        <TypographyWrapper component="div">
          <PageHeaderWrapper title={t('common.config')} subTitle={t('blocklet.component.addComponentTip.config')} />
          {/* history */}
          <TextField
            label={t('blocklet.component.mountPoint')}
            autoComplete="off"
            variant="outlined"
            name="pathPrefix"
            fullWidth
            helperText={mountPointHelperText || t('blocklet.component.mountPointTip')}
            style={{ marginBottom: 32 }}
            margin="normal"
            value={params.pathPrefix}
            onChange={(e) => {
              const pathPrefix = e.target.value;
              updateParams({ pathPrefix });

              setMountPointHelperText(t('common.slugifyHint', { value: formatMountPoint(pathPrefix) }));
            }}
            slotProps={{
              htmlInput: {
                'data-cy': 'mount-point-input',
              },
            }}
          />
          {!!error && (
            <Alert severity="error" style={{ width: '100%', marginTop: 8 }}>
              {error}
            </Alert>
          )}
        </TypographyWrapper>
      ),
      cancel: t('common.pre'),
      confirm: t('common.next'),
      onCancel,
      onConfirm: () => {
        onNext();
      },
    });
  } else if (meta) {
    params.pathPrefix = meta.interfaces?.[0]?.path || `/${meta.did}`;
  }
  if (meta && meta?.requirements?.aigne) {
    steps.push({
      key: 'aigne',
      name: (
        <Typography component="div" title={t('setting.aigne.config')} sx={{ whiteSpace: 'break-spaces' }}>
          {t('setting.aigne.config')} <Required />
        </Typography>
      ),
      body: () => (
        <TypographyWrapper component="div" className="aigne-config-wrapper">
          <PageHeader title={t('setting.aigne.config')} />
          <Box className="form-container" sx={{ '> div': { maxWidth: 'unset', width: '100%' } }}>
            <AigneConfig
              orientation="vertical"
              hideSubmitButton
              hideDivider
              source="setup"
              forceValidate
              ref={formRef}
            />
          </Box>
        </TypographyWrapper>
      ),
      cancel: t('common.pre'),
      confirm: t('common.next'),
      onCancel: () => {
        if (formRef.current.loading) {
          return;
        }
        onCancel();
      },
      onConfirm: onSubmitAigneConfig,
      loading: loading || formRef.current?.loading,
      disabled: loading || formRef.current?.loading,
    });
  }

  if (meta && params?.hasEnvironmentsStep) {
    steps.push({
      key: 'environment',
      name: (
        <>
          {t('common.environment')} {params.hasRequiredEnvironments && <Required />}
        </>
      ),
      disabled: !!editingItem || params?.hasMissRequiredConfigs,
      body: () => {
        return (
          <TypographyWrapper component="div" style={{ overflowY: 'auto' }}>
            <PageHeaderWrapper
              title={t('common.environment')}
              subTitle={t('blocklet.component.addComponentTip.environment')}
            />
            <SchemaForm
              style={{
                marginTop: -12,
                width: '100%',
              }}
              schema={params.configsList}
              defaultValue={params.configsValue}
              // eslint-disable-next-line
              onChange={(changeValue, { action, currentItem, allValues }) => {
                if (action === 'confirm') {
                  updateParams({
                    hasMissRequiredConfigs: hasMissRequiredConfigs(params.configsList, allValues),
                    configsValue: allValues,
                  });
                }
                if (action === 'edit') {
                  setEditingItem(currentItem);
                } else if (['cancel', 'confirm'].includes(action)) {
                  setEditingItem(null);
                }
              }}
            />
          </TypographyWrapper>
        );
      },
      cancel: t('common.pre'),
      confirm: t('common.next'),
      onCancel,
      onConfirm: onNext,
    });
  }
  if (meta && params?.didSpaceIsRequiredSetup) {
    steps.push({
      key: 'didSpace',
      name: (
        <>
          {t('blocklet.component.didSpaceConfig')} {params.didSpaceIsRequiredSetup === 'required' && <Required />}
        </>
      ),
      disabled: params?.didSpaceIsRequiredSetup && !params.didSpaceEndpoint,
      body: () => {
        return (
          <ConfigSpaceProvider>
            <TypographyWrapper component="div">
              <PageHeaderWrapper
                title={t('blocklet.component.didSpaceConfig')}
                subTitle={t('blocklet.component.didSpaceConfigTip')}
              />
              <Box
                sx={{
                  mt: '36px',
                  '& > div': {
                    maxWidth: 'unset !important',
                    '& .MuiAutocomplete-root': {
                      maxWidth: 'unset !important',
                    },
                  },
                }}>
                <DidSpace
                  blockletMeta={component.current.meta}
                  onNext={() => {
                    onNext();
                  }}
                  onEndpointUpdate={refreshDidSpaceEndpoint}
                />
              </Box>
            </TypographyWrapper>
          </ConfigSpaceProvider>
        );
      },
      cancel: t('common.pre'),
      confirm: t('common.next'),
      onCancel,
      onConfirm: onNext,
    });
  }
  steps.push({
    key: 'install',
    name: alreadyInstalled(meta?.did) ? t('common.upgrade') : t('common.install'),
    disabled: enableRunBackground ? false : isEmpty(params.installResultProps),
    loading: enableRunBackground ? false : isEmpty(params.installResultProps),
    body: (
      <TypographyWrapper
        component="div"
        className="flex-justify-center flex-align-center"
        style={{
          flexDirection: 'column',
        }}>
        {isEmpty(params.installResultProps) ? (
          <AnimationWaiter
            message={
              <MessageDiv>
                {enableRunBackground
                  ? t('blocklet.component.installingCanCloseWindowTip')
                  : t('blocklet.component.installingTip')}
              </MessageDiv>
            }
            increaseSpeed={0.3}
            messageLoop={false}
          />
        ) : (
          <div style={{ marginTop: 120 }}>
            <ResultMessage {...params.installResultProps} />
          </div>
        )}
      </TypographyWrapper>
    ),
    confirm: t('common.complete'),
    onConfirm: onFinish,
  });

  const step = steps[activeStep] || {};

  const isDisabled = () => {
    if (loading || step.error || !params.bundleDid) {
      return true;
    }

    // after select component and confirm license
    if (activeStep > 1) {
      return !params.pathPrefix;
    }

    return false;
  };

  if (!blocklet) {
    return null;
  }

  return (
    <Wrapper
      sx={
        inDialog
          ? {
              height: {
                xs: 'calc(100vh - 72px - 32px)',
                md: '72vh',
              },
              '&& .ll-header': {
                p: 3,
              },
              '&& .MuiDialogContent-root': {
                p: 0,
              },
              '&& .layout-content': {
                p: 0,
                pl: {
                  xs: 0,
                  md: 2,
                },
                pb: 0,
                '& .filter-bar': {
                  pt: 0,
                  pl: 2,
                },
              },
            }
          : {
              width: '100%',
              height: '100vh',
            }
      }>
      <StepProvider steps={steps} mode="memory">
        <StepContent
          ref={stepRef}
          meta={meta}
          isMobile={isMobile}
          onStepChange={(newStep) => {
            setActiveStep(newStep);
          }}
        />
      </StepProvider>
      <Box className="action-bar">
        {step.cancel && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              step.onCancel();
            }}
            disabled={activeStep === steps.length - 2 && loading}
            color="inherit">
            {step.cancel || t('common.cancel')}
          </Button>
        )}
        {step.confirm && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              step.onConfirm();
            }}
            color="primary"
            data-cy="submit-confirm-next"
            disabled={loading || (typeof step.disabled === 'boolean' ? step.disabled : isDisabled())}
            variant="contained"
            autoFocus
            title={step.confirm}
            style={{
              marginLeft: 8,
              overflow: 'hidden',
              minWidth: '140px',
              maxWidth: '280px',
              textAlign: 'center',
            }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
              }}>
              {(typeof step.loading === 'boolean' ? step.loading : loading) && (
                <CircularProgress style={{ marginRight: 8 }} size={16} />
              )}
              <Box
                component="span"
                sx={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                {step.confirm}
              </Box>
            </Box>
          </Button>
        )}
      </Box>
    </Wrapper>
  );
}

AddComponentCore.propTypes = {
  onClose: PropTypes.func,
  mode: PropTypes.oneOf(['normal', 'embed']),
  inDialog: PropTypes.bool,
  stores: PropTypes.arrayOf(PropTypes.string),
  storeUrl: PropTypes.string,
  resourceType: PropTypes.string,
  resourceDid: PropTypes.string,
  storageKey: PropTypes.string,
  selectedMeta: PropTypes.object,
  showResourcesSwitch: PropTypes.bool,
  showFromUrl: PropTypes.bool,
  enableRunBackground: PropTypes.bool,
  showCategory: PropTypes.bool,
  installFromUrlParams: PropTypes.object,
};

const Wrapper = styled(Box)`
  .action-bar {
    display: flex;
    justify-content: flex-end;
    position: sticky;
    bottom: 0;
    padding-top: 16px;
    z-index: 100;
    width: 100%;
    background: ${({ theme }) => theme.palette.background.paper};
    border-top: '1px solid';
    border-color: ${({ theme }) => theme.palette.divider};
  }
`;

const TypographyWrapper = styled(Typography)`
  width: 100%;
  height: 100%;
`;

const PageHeaderWrapper = styled(PageHeader)`
  margin-bottom: 24px;
`;

const StoreBlockletItemWrapper = styled.div`
  position: relative;

  .choose-blocklet {
    background-color: rgb(236, 251, 253);
    border-color: rgb(236, 251, 253);
    border-radius: 8px;
  }

  .check-container {
    position: absolute;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    width: 30px;
    height: 30px;
    border-radius: 0 0 8px 0;
    color: ${(props) => props.theme.palette.common.white};
    overflow: hidden;
    transition: all ease 0.3s;
    &:after {
      position: absolute;
      z-index: 0;
      display: block;
      width: 0;
      height: 0;
      border-top: transparent solid 15px;
      border-left: transparent solid 15px;
      border-bottom: ${(props) => props.theme.palette.primary.main} solid 15px;
      border-right: ${(props) => props.theme.palette.primary.main} solid 15px;
      transition: all ease 0.1s;
      content: '';
    }

    .check-icon {
      position: relative;
      z-index: 2;
      margin: 0 1px 1px 0;
      font-size: 16px;
      transition: all ease 0.2s;
    }
  }
`;

const MessageDiv = styled.div`
  color: ${(props) => props.theme.palette.primary.main};
  .msg-before {
    display: inline-block;
    color: #aaa;
    font-size: 14px;
    margin-right: 6px;
  }
`;
