import { UNOWNED_DID } from '@abtnode/constant';
import QuestionMarkIcon from '@arcblock/icons/lib/QuestionMarkCircle';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Tabs from '@arcblock/ux/lib/Tabs';
import Toast from '@arcblock/ux/lib/Toast';
import styled from '@emotion/styled';
import { Box, FormControlLabel, Radio, RadioGroup, Tooltip, Typography, useMediaQuery, Checkbox } from '@mui/material';
import { useMemoizedFn } from 'ahooks';
import pick from 'lodash/pick';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import useSetState from 'react-use/lib/useSetState';
import semver from 'semver';

import BlockletBundleAvatar from '../../bundle-avatar';

import { useBlockletContext } from '../../../contexts/blocklet';
import { useNodeContext } from '../../../contexts/node';
import EmptySpinner from '../../../empty-spinner';

import { formatError } from '../../../util';
import parseJsonText from '../../../util/parse-json-text';

import SelectBlocklets from './select-blocklets';
import ResourceSelect from './resource-select';

import Branding from './branding';
import Header from './header';
import Introduction from './introduction';
import ReleaseStepper from './release-stepper';
import ResourceUpload from './resource-upload';
import Version from './version';
import preserveOriginalStrings from '../utils/preserve-original-strings';
import ResourceDocker from './resource-docker';
import reduceFetch from '../utils/reduce-fetch';
import { useSessionContext } from '../../../contexts/session';
import getStudioStoreList from '../utils/get-studio-store-list';
import getSourceUrls from './tool';
import useStorageTTLSetState from '../../../hooks/use-storage-ttl-set-state';

const addComponentTabs = ({ tabs, blocklet, ancestors = [] }) => {
  const key = blocklet.meta.did;
  tabs.push({
    label: (
      <Box
        key={key}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}>
        <BlockletBundleAvatar size={24} blocklet={blocklet} ancestors={ancestors} />
        <Box
          className="text"
          sx={{
            ml: '4px',
          }}>
          <Box>{blocklet.meta.title}</Box>
        </Box>
      </Box>
    ),
    value: key,
  });
};

const pickParams = (baseParams, app) => {
  const params = pick(baseParams, [
    'blockletVersion',
    'blockletTitle',
    'blockletDescription',
    'blockletLogo',
    'blockletIntroduction',
    'blockletVideos',
    'blockletScreenshots',
    'blockletResourceType',
    'blockletSupport',
    'blockletHomepage',
    'blockletCommunity',
    'blockletRepository',
    'blockletDocker',
    'contentType',
    'connectedStores',
    'blockletComponents',
    'lastReleaseId',
    'uploadedResource',
    'autoUpload',
    'possibleSameStore',
    'note',
    'connectedEndpoints',
    'blockletSingleton',
  ]);

  if (!params.blockletComponents) {
    params.blockletComponents = (app.children || []).map((x) => ({
      did: x.meta.did,
      included: false,
      required: false,
    }));
  } else {
    params.blockletComponents = params.blockletComponents.map((x) => ({ ...x, included: true }));
  }

  return params;
};

const stepsToLabel = {
  0: 'branding',
  1: 'introduction',
  2: 'resources',
  3: 'blocklets',
  4: 'version',
};
const labelToStep = {
  branding: 0,
  introduction: 1,
  resources: 2,
  blocklets: 3,
  version: 4,
};

export default function CreateRelease({ initUrl = null, ...rest }) {
  const { projectId, mode, releaseId: inputReleaseId, lastVersion, componentDid = '' } = useParams();
  const skipStorage = projectId === UNOWNED_DID || mode === 'view';
  const { t, locale } = useLocaleContext();
  const { blocklet } = useBlockletContext();

  const {
    state: params,
    setState: setParams,
    historyStateRef: historyParamsRef,
    removeStorage: clearHistoryParams,
  } = useStorageTTLSetState(
    `blocklet-studio-params-${projectId}-${lastVersion}`,
    {
      blockletScreenshots: [],
      blockletVideos: [],
      publishedStoreIds: [],
      connectedStores: [],
      uploadedResource: '',
      contentType: 'blocklet',
      blockletResourceType: '',
      blockletSupport: '',
      blockletCommunity: '',
      blockletHomepage: '',
      blockletRepository: '',
      blockletDocker: {
        dockerImage: '',
        dockerArgs: [],
        dockerEnvs: [],
      },
      blockletSingleton: true,
    },
    {
      skipStorage,
    }
  );

  const [paramsErrTip, setParamsErrTip] = useSetState({});
  const [warning, setWarning] = useSetState({});
  const waringHashRef = useRef('');
  const [loading, setLoading] = useState(false);
  const [release, setRelease] = useSetState(null);
  const { api } = useNodeContext();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const [initialResources, setInitialResources] = useState({});
  const saveSelectedEventsRef = useRef({});
  const { state: selectedResourceIds, setState: _setSelectedResourceIds } = useStorageTTLSetState(
    `blocklet-studio-selectedResourceIds-${projectId}-${lastVersion}`,
    {},
    {
      skipStorage: projectId === UNOWNED_DID || mode === 'view',
    }
  );
  const [initLogoUrl, setInitLogoUrl] = useState('');
  const [resourceComponentsMap, _setResourceComponentsMap] = useSetState({});

  const dependentComponentsMode = initUrl?.searchParams.get('dependentComponentsMode');
  const disabledSelectComponents = dependentComponentsMode === 'readonly';

  const { session } = useSessionContext();
  const { storeList } = getStudioStoreList({ fromBlocklet: true, blocklet, componentDid, userDid: session?.user?.did });
  const [storePreferences, setStorePreferences] = useState([]);

  useEffect(() => {
    if (Array.isArray(storeList) && storeList.length > 0) {
      Promise.all(
        storeList.map(async (x) => {
          const res = await fetch(`${x.url}/__blocklet__.js?type=json`);

          const result = await res.json();

          return {
            ...result.preferences,
            storeInfo: x,
          };
        })
      ).then((res) => {
        setStorePreferences(res);
      });
    }
  }, [storeList.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const logoErrors = {};
    const screenshotErrors = {};

    const { logoUrl, screenshotUrls } = getSourceUrls(params, blocklet, projectId);
    Promise.all(
      storePreferences.map(async (pref) => {
        const { maxImageCount, minImageCount, logoImageType: imageType, imageMinHeight, imageMinWidth } = pref;
        const logoImageFormats = Array.isArray(imageType) ? imageType : imageType.split(',');

        if (!logoErrors[pref.storeInfo.url]) {
          logoErrors[pref.storeInfo.url] = {};
        }
        if (!screenshotErrors[pref.storeInfo.url]) {
          screenshotErrors[pref.storeInfo.url] = {};
        }

        const screenshotError = screenshotErrors[pref.storeInfo.url];
        const logoError = logoErrors[pref.storeInfo.url];

        if (Number(maxImageCount) <= screenshotUrls.length) {
          screenshotError.maxImageCount = t('blocklet.publish.storeRule.maxImageCount', {
            max: maxImageCount,
            count: screenshotUrls.length,
            unit:
              maxImageCount > 1
                ? t('blocklet.publish.storeRule.screenshots')
                : t('blocklet.publish.storeRule.screenshot'),
          });
        }
        if (Number(pref.minImageCount) > screenshotUrls.length) {
          screenshotError.minImageCount = t('blocklet.publish.storeRule.minImageCount', {
            min: minImageCount,
            count: screenshotUrls.length,
            unit:
              minImageCount > 1
                ? t('blocklet.publish.storeRule.screenshots')
                : t('blocklet.publish.storeRule.screenshot'),
          });
        }
        // check logo format
        const logoFormat = logoUrl ? logoUrl.split('.').pop() : '';
        if (
          logoFormat &&
          !(logoImageFormats.includes('jpg') ? [...logoImageFormats, 'jpeg'] : logoImageFormats).includes(logoFormat)
        ) {
          logoError.logoFormat = t('blocklet.publish.storeRule.logoFormat', {
            format: logoImageFormats.join(','),
          });
        }

        // check image size
        await Promise.all(
          screenshotUrls.map((url, index) => {
            const img = new Image();
            img.src = url;
            return new Promise((resolve) => {
              img.onload = () => {
                const { width, height } = img;
                if (width < Number(imageMinWidth) || height < Number(imageMinHeight)) {
                  let name = '';
                  switch (index + 1) {
                    case 1:
                      name = t('blocklet.publish.storeRule.first');
                      break;
                    case 2:
                      name = t('blocklet.publish.storeRule.second');
                      break;
                    case 3:
                      name = t('blocklet.publish.storeRule.third');
                      break;
                    default:
                      name = `${index + 1}`;
                      break;
                  }
                  screenshotError[`imageSize-${index + 1}`] = t('blocklet.publish.storeRule.minImageSize', {
                    width: imageMinWidth,
                    height: imageMinHeight,
                    name,
                  });
                }
                resolve();
              };
            });
          })
        );
      })
    ).then(() => {
      const hasLogoWarning = Object.values(logoErrors).some((x) => Object.values(x).length > 0);
      const hasScreenshotWarning = Object.values(screenshotErrors).some((x) => Object.values(x).length > 0);
      const hasWarning = hasLogoWarning || hasScreenshotWarning;
      const nextWaring = { logoErrors, screenshotErrors, storeList, hasWarning, hasLogoWarning, hasScreenshotWarning };
      const hash = JSON.stringify(nextWaring);
      if (hash !== waringHashRef.current) {
        setWarning(nextWaring);
        waringHashRef.current = hash;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, blocklet.did, projectId, storePreferences, t]);

  const resourceRelateComponents = useMemo(() => {
    const result = {};
    Object.keys(resourceComponentsMap).forEach((key) => {
      const item = resourceComponentsMap[key];
      if (item) {
        item.forEach((k) => {
          result[k] = true;
        });
      }
    });
    return result;
  }, [resourceComponentsMap]);

  const setResourceComponentsMap = useCallback(
    (setter) => {
      if (disabledSelectComponents) {
        setParams({
          blockletComponents: [],
        });
      }
      _setResourceComponentsMap(setter);
    },
    [disabledSelectComponents, _setResourceComponentsMap, setParams]
  );
  const setSelectedResourceIds = useCallback((...args) => {
    _setSelectedResourceIds(...args);
    setParamsErrTip({ blockletResource: '', blockletDocker: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const releaseId = inputReleaseId === 'none' ? params?.lastReleaseId || '' : inputReleaseId;
  const [activeStep, setActiveStep] = useState(mode === 'new-release' ? 4 : 0);

  const resourcesUrlTitle = initUrl?.searchParams.get('resourcesTitle');
  const componentsUrlTitle = initUrl?.searchParams.get('componentsTitle');

  const steps = [
    {
      label: t('blocklet.publish.branding'),
      description: t('blocklet.publish.steps.branding'),
    },
    {
      label: t('common.introduction'),
      description: t('blocklet.publish.steps.introduction'),
    },
    {
      label: resourcesUrlTitle || t('blocklet.publish.resourceTitle'),
      description: t('blocklet.publish.steps.resources'),
    },
    {
      label: componentsUrlTitle || t('common.components'),
      description: t('blocklet.publish.steps.blocklets'),
    },
    {
      label: t('blocklet.publish.versionTitle'),
      description: t('blocklet.publish.steps.version'),
    },
  ];

  const nowStep = steps[activeStep] || steps[steps.length - 1];
  const nowStepLabel = stepsToLabel[activeStep];

  useEffect(() => {
    if (projectId) {
      setParamsErrTip({ projectId: '' });
    }
  }, [projectId, setParamsErrTip]);

  const projectType = useMemo(() => {
    if (params?.blockletResourceType === 'resource') {
      return 'resource';
    }
    return params?.blockletComponents?.some((x) => x.included) ||
      Object.keys(resourceRelateComponents).length ||
      params?.uploadedResource
      ? 'pack'
      : 'resource';
  }, [params?.blockletComponents, params?.uploadedResource, resourceRelateComponents, params?.blockletResourceType]);
  const tabs = [];
  const resourceComponents = (blocklet?.children || [])
    .filter((x) => x.meta.resource?.exportApi)
    .filter((x) => !componentDid || x.meta.did === componentDid);

  resourceComponents.forEach((item) => {
    addComponentTabs({ tabs, blocklet: item, t, ancestors: [blocklet] });
  });

  const [tab, setTab] = useState(tabs[0]?.value);

  const readOnly = mode === 'view';

  const updateParamsByUrl = useMemoizedFn(() => {
    if (!initUrl) {
      return;
    }

    setInitLogoUrl(initUrl.searchParams.get('logo'));
    setParams((old) => {
      return {
        ...old,
        blockletTitle: old?.blockletTitle || initUrl.searchParams.get('title'),
        blockletDescription: old?.blockletDescription || initUrl.searchParams.get('description'),
        blockletIntroduction:
          old?.blockletIntroduction ||
          initUrl.searchParams.get('introduction') ||
          initUrl.searchParams.get('description'),
        blockletComponents: old?.blockletComponents?.length
          ? old?.blockletComponents
          : JSON.parse(initUrl.searchParams.get('components') || '[]'),
        note: old?.note || initUrl.searchParams.get('note') || 'No note',
      };
    });
    const resourcesString = initUrl.searchParams.get('resources');
    try {
      const resources = JSON.parse(resourcesString);
      setInitialResources(resources);
    } catch (_) {
      //
    }
  });

  const getRelease = async () => {
    if (!releaseId) {
      return;
    }
    try {
      const res = await api.getRelease({ input: { did: blocklet.meta.did, projectId, releaseId } });
      setLoading(false);
      if (!res.release) {
        Toast.error('Release not found');
        return;
      }

      res.release.note = parseJsonText(res.release.note, 'note');

      res.release = preserveOriginalStrings(res.release);
      if (mode !== 'view') {
        res.release.note = '';
      }
      setParams((lastParams) => {
        return {
          ...pickParams(
            {
              ...lastParams,
              ...res.release,
              blockletVersion:
                mode === 'create' || mode === 'new-release'
                  ? semver.inc(res.release.blockletVersion, 'patch')
                  : res.release.blockletVersion,
            },
            blocklet
          ),
        };
      });
      setRelease(res.release);
    } catch (err) {
      setLoading(false);
      Toast.error(formatError(err));
    }
  };

  const getProject = async () => {
    if (projectId === UNOWNED_DID) {
      setParams({ blockletVersion: '0.0.1', blockletTitle: '' });
      return;
    }
    if (!projectId) {
      Toast.error(t('blocklet.publish.errorTip.noDid'));
      return;
    }
    try {
      const res = await reduceFetch(
        api.getProject,
        [
          {
            input: {
              did: blocklet.meta.did,
              projectId,
            },
          },
        ],
        {
          key: 'getProject',
        }
      );

      const data = res.project || {};

      if (!data.blockletVersion) {
        data.blockletVersion = '0.0.1';
      } else if ((mode === 'create' || mode === 'new-release') && semver.valid(data.blockletVersion)) {
        data.blockletVersion = semver.inc(data.blockletVersion, 'patch');
      }
      const theParams = pickParams(data, blocklet);
      setParams({
        ...theParams,
      });
      if (!data.lastReleaseId) {
        updateParamsByUrl();
      }
    } catch (err) {
      Toast.error(formatError(err));
    }
  };

  const getData = useCallback(async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      if (mode === 'view') {
        if (!releaseId) {
          Toast.error('Empty release id');
          return;
        }
        await getProject();
        await getRelease();
        return;
      }
      await getProject();
      if (releaseId) {
        await getRelease();
      }
    } finally {
      if (mode !== 'view') {
        setParams((v) => {
          return {
            ...v,
            ...historyParamsRef.current,
          };
        });
      }

      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, releaseId]);

  const handleChangeSelectedComponents = (data) => {
    setParams({ blockletComponents: data });
  };
  const handleChangeBlockletResourceType = (blockletResourceType) => {
    setParams({ blockletResourceType });
  };

  useEffect(() => {
    getData();
  }, [getData]);

  useEffect(() => {
    if (projectId === UNOWNED_DID && (mode === 'create' || mode === 'new-release') && initUrl) {
      updateParamsByUrl();
    }
  }, [projectId, initUrl, mode, updateParamsByUrl]);

  useEffect(() => {
    if (params.contentType === 'docker') {
      setParams({ resourceFromSelect: false });
    } else if (params.contentType === 'blocklet') {
      setParams({ resourceFromSelect: true });
    } else if (params.contentType === 'upload') {
      setParams({ resourceFromSelect: false });
    }
  }, [params.contentType, setParams]);

  const hasSelectedResources = useMemo(() => {
    return !!Object.keys(selectedResourceIds).find((key) => {
      if (selectedResourceIds[key].length) {
        return true;
      }
      return false;
    });
  }, [selectedResourceIds]);

  if (!params && loading) {
    return <EmptySpinner />;
  }

  if (!params) {
    return null;
  }

  const resourceItem = resourceComponents.find((x) => x.meta.did === tab);

  const onTabChange = (x) => {
    setTab(x);
  };

  return (
    <Main {...rest}>
      <Header
        blocklet={blocklet}
        release={release}
        getData={getData}
        getRelease={getRelease}
        mode={mode}
        params={params}
        setParams={setParams}
        setParamsErrTip={setParamsErrTip}
        warning={warning}
        readOnly={readOnly}
        loading={loading}
        setLoading={setLoading}
        initLogoUrl={initLogoUrl}
        releaseId={releaseId}
        projectId={projectId}
        projectType={projectType}
        resourceComponents={resourceComponents}
        resourceComponentsMap={resourceComponentsMap}
        resourceRelateComponents={resourceRelateComponents}
        resourceItem={resourceItem}
        saveSelectedEventsRef={saveSelectedEventsRef}
        hasSelectedResources={hasSelectedResources}
        setRelease={setRelease}
        paramsErrTip={paramsErrTip}
        clearHistoryParams={clearHistoryParams}
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}>
        <Box
          sx={{
            pt: 3,
          }}
        />
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 3,
          }}>
          {!isMobile && (
            <ReleaseStepper
              steps={steps}
              loading={loading}
              viewMode={mode === 'view'}
              params={params}
              hasSelectedResources={hasSelectedResources || params.uploadedResource}
              paramsErrTip={paramsErrTip}
              warning={warning}
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              projectId={projectId}
              resourcesUrlTitle={resourcesUrlTitle}
              componentsUrlTitle={componentsUrlTitle}
            />
          )}
          <Box
            sx={{
              flex: '1',
              maxWidth: '720px',
            }}>
            {!isMobile && nowStepLabel !== 'introduction' && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                {nowStep.label}
                {nowStepLabel === 'branding' && (
                  <Tooltip title={t('blocklet.publish.brandingHelp')} placement="right">
                    <Box
                      component="a"
                      target="_blank"
                      href={`https://www.arcblock.io/docs/blocklet-store/${locale}/blocklet-detail-page`}
                      sx={{ paddingTop: 1, marginLeft: 1 }}
                      style={{ color: 'gray' }}>
                      <QuestionMarkIcon />
                    </Box>
                  </Tooltip>
                )}
              </Typography>
            )}
            {(isMobile || nowStepLabel === 'branding') && (
              <Box
                sx={{
                  flexDirection: 'column',
                }}>
                <Branding
                  projectId={projectId}
                  setParams={setParams}
                  setParamsErrTip={setParamsErrTip}
                  warning={warning}
                  params={params}
                  componentDid={componentDid}
                  blocklet={blocklet}
                  initUrl={initUrl}
                  loading={loading}
                  setLoading={setLoading}
                  paramsErrTip={paramsErrTip}
                  readOnly={readOnly}
                  initLogoUrl={initLogoUrl}
                  setInitLogoUrl={setInitLogoUrl}
                />
              </Box>
            )}
            {isMobile && (
              <Box
                sx={{
                  flexDirection: 'column',
                }}>
                <Version
                  loading={loading}
                  params={params}
                  paramsErrTip={paramsErrTip}
                  setParams={setParams}
                  setParamsErrTip={setParamsErrTip}
                  readOnly={readOnly}
                />
              </Box>
            )}
            {(isMobile || nowStepLabel === 'introduction') && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  mt: isMobile ? 5 : 0,
                  width: '100%',
                }}>
                <Introduction
                  loading={loading}
                  readOnly={readOnly}
                  params={params}
                  setParams={setParams}
                  paramsErrTip={paramsErrTip}
                  setParamsErrTip={setParamsErrTip}
                />
              </Box>
            )}

            {isMobile && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  mt: 5,
                }}>
                {steps[labelToStep.resources].label}
              </Typography>
            )}
            <Box
              sx={{
                display: isMobile || nowStepLabel === 'resources' ? 'flex' : 'none',
                flexDirection: 'column',
                maxWidth: 720,
              }}>
              <Box
                className="section full-width"
                sx={{
                  display: 'flex',
                  mt: 3,
                }}>
                <Box sx={{ flex: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={params.blockletSingleton || false}
                        onChange={(e) => setParams({ blockletSingleton: e.target.checked })}
                        disabled={readOnly}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {t('blocklet.publish.singleton')}
                        <Tooltip title={t('blocklet.publish.singletonTip')} placement="right">
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              cursor: 'help',
                              color: 'text.secondary',
                            }}>
                            <QuestionMarkIcon />
                          </Box>
                        </Tooltip>
                      </Box>
                    }
                    sx={{ mt: 0 }}
                  />
                  <RadioGroup onChange={(e) => setParams({ contentType: e.target.value })}>
                    <FormControlLabel
                      value="blocklet"
                      disabled={readOnly}
                      control={<Radio size="small" checked={params.contentType === 'blocklet'} />}
                      label={t('blocklet.publish.resourceSelect')}
                    />
                    <FormControlLabel
                      value="upload"
                      disabled={readOnly}
                      control={<Radio size="small" checked={params.contentType === 'upload'} />}
                      label={t('blocklet.publish.resourceUpload')}
                    />
                    <FormControlLabel
                      value="docker"
                      disabled={readOnly}
                      control={<Radio size="small" checked={params.contentType === 'docker'} />}
                      label={t('blocklet.publish.resourceDocker')}
                    />
                  </RadioGroup>

                  <Box
                    sx={{
                      display: params.contentType === 'blocklet' ? 'block' : 'none',
                    }}>
                    {!componentDid && (
                      <Tabs
                        tabs={tabs}
                        current={tab}
                        onChange={onTabChange}
                        sx={{ ml: -2, mt: 2, maxWidth: isMobile ? window.innerWidth - 24 : '100%' }}
                      />
                    )}
                    <ResourceSelect
                      loading={loading}
                      initialResources={initialResources}
                      saveSelectedEventsRef={saveSelectedEventsRef}
                      selectedResourceIds={selectedResourceIds}
                      setSelectedResourceIds={setSelectedResourceIds}
                      setResourceComponentsMap={setResourceComponentsMap}
                      error={paramsErrTip.blockletResource}
                      app={blocklet}
                      readOnly={readOnly}
                      component={resourceItem}
                      componentDid={componentDid}
                      initUrl={initUrl}
                      params={params}
                      showTree={params.contentType === 'blocklet'}
                      setParams={setParams}
                      projectId={projectId === UNOWNED_DID ? '' : projectId}
                      release={{
                        ...release,
                        id: releaseId,
                      }}
                    />
                  </Box>
                  {params.contentType === 'upload' && (
                    <ResourceUpload
                      app={blocklet}
                      readOnly={readOnly}
                      projectId={projectId === UNOWNED_DID ? '' : projectId}
                      params={params}
                      error={paramsErrTip.blockletResource}
                      setParams={setParams}
                      setParamsErrTip={setParamsErrTip}
                    />
                  )}

                  {params.contentType === 'docker' && (
                    <ResourceDocker
                      app={blocklet}
                      readOnly={readOnly}
                      projectId={projectId === UNOWNED_DID ? '' : projectId}
                      params={params}
                      error={paramsErrTip.blockletResource}
                      setParams={setParams}
                      setParamsErrTip={setParamsErrTip}
                      paramsErrTip={paramsErrTip}
                    />
                  )}
                </Box>
              </Box>
            </Box>
            {isMobile && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  mt: 5,
                }}>
                {steps[labelToStep.blocklets].label}
              </Typography>
            )}
            {(isMobile || nowStepLabel === 'blocklets') && (
              <Box
                sx={{
                  flexDirection: 'column',
                }}>
                <Box
                  className="section full-width"
                  sx={{
                    display: 'flex',
                    mt: 3,
                  }}>
                  <Box sx={{ flex: 1 }}>
                    <SelectBlocklets
                      projectType={projectType}
                      disabled={loading || readOnly}
                      app={blocklet}
                      value={params?.blockletComponents || []}
                      blockletResourceType={params?.blockletResourceType || ''}
                      onChange={handleChangeSelectedComponents}
                      onChangeBlockletResourceType={handleChangeBlockletResourceType}
                      resourceRelateComponents={resourceRelateComponents}
                      dependentComponentsMode={dependentComponentsMode}
                    />
                  </Box>
                </Box>
              </Box>
            )}
            {!isMobile && nowStepLabel === 'version' && (
              <Box
                sx={{
                  flexDirection: 'column',
                }}>
                <Version
                  loading={loading}
                  params={params}
                  paramsErrTip={paramsErrTip}
                  setParams={setParams}
                  setParamsErrTip={setParamsErrTip}
                  readOnly={readOnly}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Main>
  );
}
CreateRelease.propTypes = {
  initUrl: PropTypes.object,
};

const Main = styled.div`
  .section {
    &.full-width {
      max-width: 100%;
    }
    .MuiTypography-h3 {
      font-size: 1.1rem;
      font-weight: 700;
    }
    .left {
      flex-shrink: 0;
      width: 140px;
    }
    .MuiTabs-indicator {
      display: none;
    }
    .MuiTypography-subtitle1 {
      width: 120px;
      font-weight: 700;
      font-size: 1rem;
      ${({ theme }) => theme.breakpoints.down('sm')} {
        width: 80px;
      }
    }
  }
  .MuiButtonBase-root {
    a {
      color: inherit;
    }
  }
  .MuiInputBase-multiline .MuiInputAdornment-positionEnd {
    align-self: flex-end;
    .MuiTypography-root {
      font-size: 0.8rem;
    }
    font-size: 0.8rem;
  }
`;
