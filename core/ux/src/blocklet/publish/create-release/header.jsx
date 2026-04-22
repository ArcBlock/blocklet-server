import { UNOWNED_DID, WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast/index';
import { PROJECT } from '@blocklet/constant';
import styled from '@emotion/styled';
import { Icon } from '@iconify/react';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import {
  Stack,
  Box,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Dialog as MaterialDialog,
  Typography,
  useMediaQuery,
} from '@mui/material';
import Spinner from '@mui/material/CircularProgress';
import pick from 'lodash/pick';
import pAll from 'p-all';
import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import semver from 'semver';
import { joinURL } from 'ufo';

import Tabs from '@arcblock/ux/lib/Tabs';
import ClickToCopy from '../../../click-to-copy';
import { useNodeContext } from '../../../contexts/node';
import { formatError } from '../../../util';
import ShortenLabel from '../../component/shorten-label';
import parseResourceRelateComponents from '../utils/parse-resource-relate-components';
import uploadImageToProject from '../utils/upload-image-to-project';
import { validateParams } from '../utils/validate-params';
import { waitGetConnectedStore, waitGetConnectedEndpoint } from '../utils/wait-connect';
import ConnectStoreList from './connect-store-list';
import ConnectEndpointList from '../endpoint/list';
import ProjectSetting from './project-setting';
import { uploadResource } from './resource-select';
import UploadedToast from './uploaded-toast';
import InstallButton from './install-button';
import ListHeader from '../../../list-header';

const serverEndpoint = window.env?.serverEndpoint;

function Header({
  projectId,
  params,
  setParamsErrTip,
  initUrl = null,
  setParams,
  mode,
  loading,
  blocklet,
  release = null,
  releaseId,
  getData,
  getRelease,
  paramsErrTip,
  warning,
  componentDid = '',
  resourceRelateComponents,
  disabledSelectComponents = false,
  saveSelectedEventsRef,
  hasSelectedResources,
  initLogoUrl,
  setLoading,
  clearHistoryParams,
  projectType,
  readOnly,
}) {
  const { t, locale } = useLocaleContext();

  const tabs = [
    {
      label: (
        <Box
          sx={{
            textAlign: 'center',
            width: '100%',
          }}>
          {t('blocklet.publish.store')}
        </Box>
      ),
      value: 'store',
    },
    {
      label: (
        <Box
          sx={{
            textAlign: 'center',
            width: '100%',
          }}>
          {t('blocklet.publish.endpoint.tab')}
        </Box>
      ),
      value: 'endpoint',
    },
  ];

  const [currentTab, setCurrentTab] = useState(tabs[0].value);
  const { api } = useNodeContext();
  const navigate = useNavigate();
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [showSetting, setShowSetting] = useState(false);
  const [installResourceTip, setInstallResourceTip] = useState();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const releaseType = useMemo(() => {
    if (params?.blockletResourceType) {
      return params?.blockletResourceType;
    }
    if (params?.blockletComponents?.length > 0) {
      const res = params?.blockletComponents.find((x) => {
        return x.included;
      });
      return res ? 'resource' : 'pack';
    }
    return 'resource';
  }, [params?.blockletComponents, params?.blockletResourceType]);

  const onPublish = () => {
    window.parent.postMessage({ event: 'studioDialog.uploaded', componentDid }, '*');
    getRelease();
  };

  const _onRelease = async (status) => {
    if (paramsErrTip?.blockletHomepage || paramsErrTip?.blockletSupport || paramsErrTip?.blockletCommunity) {
      Toast.error(paramsErrTip?.blockletHomepage || paramsErrTip?.blockletSupport || paramsErrTip?.blockletCommunity);
      return;
    }
    const errors = validateParams({
      params,
      hasSelectedResources,
      projectId,
      status,
      t,
    });
    if (errors) {
      Toast.error(errors.map((x) => x.message).join('; '));
      setParamsErrTip(errors.reduce((acc, x) => ({ ...acc, [x.param]: x.message }), {}));
      return;
    }

    const _params = { ...params };
    _params.blockletComponents = parseResourceRelateComponents(
      _params.blockletComponents,
      blocklet,
      resourceRelateComponents,
      disabledSelectComponents
    );

    _params.blockletVersion = semver.valid(_params.blockletVersion);
    if (!_params.blockletVersion) {
      Toast.error('Invalid Blocklet Version');
      setParamsErrTip({ blockletVersion: 'Invalid Blocklet Version' });
      return;
    }

    if (initLogoUrl) {
      try {
        const filename = await uploadImageToProject({ did: blocklet.meta.did, projectId, imageUrl: initLogoUrl });
        _params.blockletLogo = filename;
        setParams({ blockletLogo: filename });
      } catch (err) {
        Toast.error(err.message);
        return;
      }
    }

    if (params.resourceFromSelect) {
      _params.uploadedResource = '';
      try {
        const saveKeys = Object.keys(saveSelectedEventsRef.current);
        await pAll(
          saveKeys.map((x) => {
            return () => {
              const item = saveSelectedEventsRef.current[x];
              return uploadResource({
                api,
                locale,
                projectId,
                releaseId: '',
                appDid: blocklet.meta.did,
                component: item.component,
                resources: item.resources,
                initUrl,
              });
            };
          }),
          { concurrency: 2 }
        );
      } catch (err) {
        Toast.error(err?.response?.data?.error?.message || err.message);
        setParamsErrTip({ blockletResource: 'Invalid save the resource' });
        return;
      }
    } else if (!params.blockletDocker?.dockerImage) {
      _params.blockletComponents = [];
    }

    _params.blockletTitle = (_params.blockletTitle || '').trim();
    _params.blockletDescription = (_params.blockletDescription || '').trim();
    _params.blockletSupport = (_params.blockletSupport || '').trim();
    _params.blockletHomepage = (_params.blockletHomepage || '').trim();
    _params.blockletCommunity = (_params.blockletCommunity || '').trim();
    _params.blockletRepository = (_params.blockletRepository || '').trim();
    _params.blockletIntroduction = (_params.blockletIntroduction || '').trim();
    _params.note = (_params.note || '').trim();
    _params.blockletComponents = (_params?.blockletComponents || [])
      .filter((x) => x.included)
      .map((x) => pick(x, ['did', 'required']))
      .map(JSON.stringify);

    if (_params.contentType !== 'docker') {
      _params.blockletDocker = {
        dockerImage: '',
        dockerCommand: '',
        dockerArgs: [],
        dockerEnvs: [],
      };
    }
    _params.blockletDocker.dockerImage = _params.blockletDocker.dockerImage || '';

    // 修复历史 docker 项目，如果没有重新编辑进行 parse
    if (_params.blockletDocker.dockerArgs.length > 0) {
      _params.blockletDocker.dockerArgs.forEach((arg) => {
        arg.proxyBehavior = arg.proxyBehavior || 'service';
      });
    }

    try {
      await api.createRelease({
        input: {
          ..._params,
          note: JSON.stringify({ note: _params.note }),
          did: blocklet.meta.did,
          projectId,
          releaseId: '',
          status,
          blockletSingleton: typeof _params.blockletSingleton === 'boolean' ? _params.blockletSingleton : false,
        },
      });

      clearHistoryParams();
      Toast.success(t('blocklet.publish.createReleaseSuccess'));
      window.parent.postMessage({ event: 'studioDialog.released', componentDid }, '*');

      setParamsErrTip({
        blockletResource: '',
        blockletTitle: '',
        blockletDescription: '',
        blockletVersion: '',
        blockletLogo: '',
        projectId: '',
        blockletIntroduction: '',
        note: '',
      });
    } catch (err) {
      const msg = formatError(err);
      Toast.error(msg);
      if (/resource/.test(msg) || /zip/.test(msg)) {
        setParamsErrTip({ blockletResource: msg });
      }
      return;
    }
    const lastProject = await api.getProject({
      input: {
        did: blocklet.meta.did,
        projectId,
      },
    });

    const newReleased = lastProject.project.lastReleaseId;
    if (params.autoUpload) {
      await pAll(
        lastProject.project.connectedStores.map((store) => {
          return async () => {
            try {
              const logoError = warning.logoErrors[store.storeUrl];
              if (logoError) {
                const errorKey = Object.keys(logoError).find((key) => {
                  return !!logoError[key];
                });
                if (errorKey) {
                  Toast.warning(
                    t('blocklet.publish.autoPublishErrorTip', {
                      storeName: store.storeName,
                      error: logoError[errorKey],
                    })
                  );
                  return;
                }
              }

              const screenshotError = warning.screenshotErrors[store.storeUrl];
              if (screenshotError) {
                const errorKey = Object.keys(screenshotError).find((key) => {
                  return !!screenshotError[key];
                });
                if (errorKey) {
                  Toast.warning(
                    t('blocklet.publish.autoPublishErrorTip', {
                      storeName: store.storeName,
                      error: screenshotError[errorKey],
                    })
                  );
                  return;
                }
              }

              const res = await api.publishToStore({
                input: {
                  did: blocklet.meta.did,
                  storeId: store.storeId,
                  storeName: store.storeName,
                  projectId,
                  releaseId: newReleased,
                  type: releaseType,
                },
              });
              Toast.success(
                <UploadedToast
                  storeName={store.storeName}
                  storeUrl={store.storeUrl}
                  developerDid={store.developerDid}
                  did={projectId}
                  published={res.url === 'published'}
                  version={_params.blockletVersion}
                />,
                { duration: 10000 }
              );
            } catch (err) {
              Toast.error(formatError(err));
            }
          };
        }),
        { concurrency: 4 }
      );
    }

    onPublish?.();
    navigate(`../${projectId}/view/${newReleased}/${_params.blockletVersion}`, { replace: true });
  };

  const onRelease = (status) => {
    setLoading(true);
    return _onRelease(status).finally(() => {
      setLoading(false);
    });
  };

  const onOpenConnectStore = async (param) => {
    await waitGetConnectedStore(api, param);
    getData();
  };

  const onOpenConnectEndpoint = async (param) => {
    await waitGetConnectedEndpoint(api, param);
    getData();
  };

  const handleShowSetting = () => {
    setShowSetting(true);
  };

  const blockletMetaUrl = joinURL(
    serverEndpoint,
    `/api/project/${blocklet.meta.did}/${projectId}/${releaseId}/release/blocklet.json`
  );
  const url = new URL(serverEndpoint);
  url.pathname = joinURL(url.pathname, '/launch-blocklet/agreement');
  url.searchParams.set('blocklet_meta_url', blockletMetaUrl);
  const installUrl = url.href;
  const handleSetTip = () => setInstallResourceTip(blockletMetaUrl);

  return (
    <>
      <Content className="sticky-header">
        <ListHeader
          left={
            <Breadcrumbs className="breadcrumbs" aria-label="breadcrumb">
              <Link to="../">{t('common.blockletStudio')}</Link>
              {projectId === UNOWNED_DID ? (
                <Typography
                  sx={{
                    color: 'text.primary',
                  }}>
                  <ShortenLabel maxLength={isMobile ? 6 : 30}>{params?.blockletTitle || 'Blocklet'}</ShortenLabel>
                </Typography>
              ) : (
                <Link to={`../${projectId}`}>
                  <ShortenLabel maxLength={isMobile ? 6 : 30}>{params?.blockletTitle || 'Blocklet'}</ShortenLabel>
                </Link>
              )}
              <Typography
                sx={{
                  color: 'text.primary',
                }}>
                {mode === 'create' ? t('common.create') : params?.blockletVersion || t('common.edit')}
              </Typography>
            </Breadcrumbs>
          }
          actions={
            <>
              {!readOnly && (
                <ButtonGroup disabled={loading} variant="contained">
                  <Button variant="contained" onClick={() => onRelease(PROJECT.RELEASE_STATUS.published)}>
                    {loading && <Spinner size={14} sx={{ mr: 0.5 }} color="inherit" />}
                    {t('blocklet.publish.createRelease')}
                  </Button>
                  <Button variant="contained" onClick={handleShowSetting}>
                    <Icon icon="mage:settings-fill" fontSize="16px" />
                  </Button>
                </ButtonGroup>
              )}
              {readOnly && (
                <>
                  <MaterialDialog
                    fullWidth
                    maxWidth="sm"
                    open={installResourceTip}
                    onClose={() => setInstallResourceTip('')}>
                    <Box sx={{ py: 5, px: 4, wordBreak: 'break-all' }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        {t('blocklet.publish.installResourceTip')}
                      </Typography>
                      <ClickToCopy>{installResourceTip}</ClickToCopy>
                      <Typography sx={{ mt: 2 }}>
                        {t('blocklet.publish.installResourceTip2')}
                        <a
                          style={{ marginLeft: 4 }}
                          href="https://www.arcblock.io/docs/blocklet-developer/how-to-use-install-url"
                          target="_blank"
                          rel="noreferrer">
                          {t('blocklet.publish.installResourceHelp')}
                        </a>
                      </Typography>
                    </Box>
                  </MaterialDialog>
                  <ButtonGroup disabled={loading} variant="contained">
                    <Button onClick={() => setShowStoreDialog(true)}>
                      {loading ? (
                        <Spinner size={14} sx={{ mr: 1 }} color="inherit" />
                      ) : (
                        <CloudUploadRoundedIcon sx={{ fontSize: '1.3em', mr: 1 }} />
                      )}
                      {isMobile ? t('common.upload') : t('blocklet.publish.connectOrUpload')}
                    </Button>
                    <InstallButton
                      isPack={releaseType === 'pack'}
                      downloadUrl={joinURL(
                        `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/project/${
                          blocklet.meta.did
                        }/${projectId}/${releaseId}/download/${(release?.files || [])[0]}`
                      )}
                      installUrl={installUrl}
                      handleSetTip={handleSetTip}
                    />
                    <Button onClick={handleShowSetting}>
                      <Icon icon="mage:settings-fill" fontSize="16px" />
                    </Button>
                  </ButtonGroup>
                </>
              )}
            </>
          }
        />
      </Content>
      <Dialog
        title={t('blocklet.publish.connectOrUpload')}
        disableEscapeKeyDown
        disablePortal={false}
        fullWidth
        open={showStoreDialog}
        onClose={() => setShowStoreDialog(false)}>
        <Box>
          <Box
            sx={{
              mt: -2,
              mb: 2,
            }}>
            <Tabs tabs={tabs} current={currentTab} onChange={setCurrentTab} />
          </Box>

          {currentTab === 'store' && (
            <ConnectStoreList
              projectType={projectType}
              blocklet={blocklet}
              version={params.blockletVersion}
              releaseType={releaseType}
              projectId={projectId}
              releaseId={releaseId}
              componentDid={componentDid}
              warning={warning}
              onPublish={onPublish}
              onOpenConnectStore={onOpenConnectStore}
              onDelete={getData}
              connectedStores={params.connectedStores || []}
              publishedStoreIds={release?.publishedStoreIds}
            />
          )}

          {currentTab === 'endpoint' && (
            <Stack
              sx={{
                minHeight: 400,
              }}>
              <ConnectEndpointList
                blocklet={blocklet}
                releaseType={releaseType}
                projectId={projectId}
                releaseId={releaseId}
                warning={warning}
                publishedEndpointIds={[]}
                connectedEndpoints={params.connectedEndpoints || []}
                onPublish={onPublish}
                onOpenConnectEndpoint={onOpenConnectEndpoint}
                onDelete={getData}
              />
            </Stack>
          )}
        </Box>
      </Dialog>
      <ProjectSetting
        did={blocklet?.meta?.did}
        params={params}
        projectId={projectId}
        open={showSetting}
        setParams={setParams}
        onClose={() => setShowSetting(false)}
      />
    </>
  );
}

Header.propTypes = {
  projectId: PropTypes.string.isRequired,
  params: PropTypes.object.isRequired,
  mode: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  blocklet: PropTypes.object.isRequired,
  release: PropTypes.object,
  releaseId: PropTypes.string.isRequired,
  getData: PropTypes.func.isRequired,
  getRelease: PropTypes.func.isRequired,
  componentDid: PropTypes.string,
  resourceRelateComponents: PropTypes.object.isRequired,
  disabledSelectComponents: PropTypes.bool,
  saveSelectedEventsRef: PropTypes.object.isRequired,
  hasSelectedResources: PropTypes.bool.isRequired,
  initLogoUrl: PropTypes.string.isRequired,
  setLoading: PropTypes.func.isRequired,
  projectType: PropTypes.string.isRequired,
  setParamsErrTip: PropTypes.func.isRequired,
  warning: PropTypes.object.isRequired,
  setParams: PropTypes.func.isRequired,
  initUrl: PropTypes.object,
  paramsErrTip: PropTypes.object.isRequired,
  clearHistoryParams: PropTypes.func.isRequired,
  readOnly: PropTypes.bool.isRequired,
};

const Content = styled.div`
  .sticky-header {
    margin-top: -12px;
    padding: 12px 0;
    position: sticky;
    top: 0;
    z-index: 99;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #fff;
    padding-bottom: 12px;
    border-bottom: ${({ theme }) => `1px solid ${theme.palette.divider}`};
  }
`;

export default Header;
