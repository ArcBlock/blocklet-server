/* eslint-disable react/require-default-props */

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { hasStartEngine } from '@blocklet/meta/lib/engine';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import classnames from 'classnames';
import pAll from 'p-all';
import PropTypes from 'prop-types';
import { useEffect, useRef, useCallback } from 'react';
import useSetState from 'react-use/lib/useSetState';
import { joinURL } from 'ufo';

import { EmptyIcon } from '@arcblock/icons';
import Toast from '@arcblock/ux/lib/Toast/index';
import { getDisplayName } from '@blocklet/meta/lib/util';
import { getCSRFToken } from '@blocklet/js-sdk';
import { useNodeContext } from '../../../contexts/node';
import { axios } from '../../../util/api';
import keepNowResources from './keep-now-resources';
import StopBox from './stop-box';
import Tree from './tree';
import reduceFetch from '../utils/reduce-fetch';

const fillParent = (nodes, parentId) => {
  nodes.forEach((node) => {
    if (parentId) {
      node.parent = parentId;
    }
    (node.children || []).forEach((child) => {
      child.parent = node.id;
      fillParent(child.children || [], child.id);
    });
  });

  return nodes;
};

const parseUrl = (component, projectId, releaseId, locale, initUrl) => {
  const { exportApi = '/' } = component?.meta.resource || {};

  const urlObj = new URL(joinURL('http://127.0.0.1', component?.mountPoint, exportApi || '/').replace(/\/+/g, '/'));

  urlObj.searchParams.set('projectId', projectId);
  urlObj.searchParams.set('releaseId', releaseId);
  urlObj.searchParams.set('local', locale);
  if (initUrl) {
    urlObj.searchParams.set('resourcesParams', initUrl.searchParams.get('resourcesParams'));
  }
  return `${urlObj.pathname}${urlObj.search}`;
};

export const uploadResource = async ({ api, appDid, component, projectId, releaseId, locale, initUrl, resources }) => {
  let resourcesParams;

  if (initUrl && initUrl.searchParams.get('resourcesParams')) {
    try {
      resourcesParams = JSON.parse(initUrl.searchParams.get('resourcesParams'));
    } catch (err) {
      Toast.error(err.message);
      return;
    }
  }
  await axios.post(
    parseUrl(component, projectId, releaseId, locale, initUrl),
    {
      resources,
      projectId,
      releaseId,
      locale,
      ...(resourcesParams ? { resourcesParams } : {}),
    },
    {
      headers: {
        'x-csrf-token': getCSRFToken(),
      },
      timeout: 10 * 60 * 1000,
    }
  );

  await api.updateSelectedResources({
    input: {
      did: appDid,
      projectId,
      releaseId: '',
      componentDid: component.meta.did,
      resources,
    },
  });
};

const getNodeIdDependencies = (node, nodeIds) => {
  if (!node) {
    return {};
  }
  const nodeIdMap = nodeIds.reduce((acc, curr) => {
    acc[curr] = true;
    return acc;
  }, {});
  const getDependencies = (children, deps) => {
    children.forEach((child) => {
      if (nodeIdMap[child.id] && child.dependentComponents?.length) {
        child.dependentComponents.forEach((dep) => {
          deps[dep] = true;
        });
      }
      if (child.children) {
        getDependencies(child.children, deps);
      }
    });
    return deps;
  };
  return getDependencies(node, {});
};

export default function ResourceSelect({
  app,
  component,
  projectId,
  release = { id: '' },
  loading = false,
  error = '',
  saveSelectedEventsRef,
  readOnly,
  componentDid = '',
  initialResources = {},
  setResourceComponentsMap = () => {},
  selectedResourceIds,
  setSelectedResourceIds,
  showTree,
  initUrl = null,
}) {
  const { t, locale } = useLocaleContext();
  const { api } = useNodeContext();

  const [resources, setResources] = useSetState({});
  const refs = useRef({});
  const loadedDataRef = useRef(false);

  const releaseId = release.id;
  refs.current.projectId = projectId;
  refs.current.releaseId = releaseId;

  const setSelectedComponentsMapByIds = (did, theResource, ids) => {
    if (!theResource) {
      return;
    }
    const deps = getNodeIdDependencies(theResource, ids);
    setResourceComponentsMap?.({ [did]: Object.keys(deps) });
  };

  const handleTreeChange = (data) => {
    saveSelectedEventsRef.current[component.meta.did] = {
      resources: data,
      component,
    };
    setSelectedResourceIds({ [component.meta.did]: data });
    setSelectedComponentsMapByIds(component.meta.did, resources[component.meta.did], data);
  };

  const getResTree = useCallback(
    async (componentMeta) => {
      try {
        const resTree = await reduceFetch(
          axios.get,
          [
            parseUrl(componentMeta, projectId, releaseId, locale, initUrl),
            {
              timeout: 60 * 1000,
            },
          ],
          {
            key: 'getResources',
          }
        );
        const tree = fillParent(resTree?.data?.resources || []);
        return tree;
      } catch (err) {
        return [];
      }
    },
    [projectId, releaseId, locale, initUrl]
  );

  // 切换组件时，若资源为空，则重新加载
  useEffect(() => {
    if (!resources[component?.meta.did]) {
      getResTree(component)
        .then((tree) => {
          setResources({ [component?.meta.did]: tree });
        })
        .catch((err) => {
          Toast.error(err.message);
        });
    }
  }, [component, setResources, resources, getResTree]);
  // 初始化获取各组件的资源
  useEffect(() => {
    if (releaseId && projectId && !loadedDataRef.current) {
      pAll(
        app.children.map((child) => {
          return async () => {
            // If it is under a certain tenant, only the data of the current tenant is requested
            if (componentDid && componentDid !== child.meta.did) {
              return;
            }
            // If the component does not have a mount point or does not start the engine, the resource is not requested
            if (!child?.mountPoint || !hasStartEngine(child?.meta) || !child?.meta?.resource?.exportApi) {
              return;
            }
            try {
              const tree = await getResTree(child);
              setResources({ [child?.meta.did]: tree });

              const res = await api.getSelectedResources({
                input: { did: app.meta.did, projectId, releaseId, componentDid: child.meta.did },
              });

              const list = res?.resources || [];
              if (list?.length) {
                setSelectedResourceIds({ [child.meta.did]: keepNowResources(tree, list) });
                setSelectedComponentsMapByIds(child.meta.did, tree, list);
                if (!readOnly) {
                  saveSelectedEventsRef.current[child?.meta.did] = {
                    resources: list,
                    component: child,
                  };
                }
              }
            } catch (err) {
              Toast.error(err.message);
            }
          };
        }),
        {
          concurrency: 2,
        }
      ).then(() => {
        loadedDataRef.current = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseId, projectId, readOnly, locale, initUrl, setResources]);
  // 根据 URL 上 resource 参数，获取资源树
  useEffect(() => {
    if (initialResources && Object.keys(initialResources).length) {
      pAll(
        app.children.map(async (child) => {
          const list = initialResources[child.meta.did];
          if (list?.length) {
            const tree = await getResTree(child);
            setSelectedResourceIds({ [child.meta.did]: list });
            setSelectedComponentsMapByIds(child.meta.did, tree, list);
            if (!readOnly) {
              saveSelectedEventsRef.current[child?.meta.did] = {
                resources: list,
                component: child,
              };
            }
          }
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, initialResources, readOnly]);
  let Empty = null;
  if (!component || !resources[component.meta.did]?.length) {
    Empty = (
      <StopBox Icon={EmptyIcon}>{t('blocklet.publish.resourceEmptyTip', { name: getDisplayName(component) })}</StopBox>
    );
  }

  if (component?.status !== 'running') {
    Empty = <StopBox>{t('blocklet.publish.componentNotRunning', { name: getDisplayName(component) })}</StopBox>;
  }

  return (
    <>
      <Container className={classnames(error && 'error')}>
        {showTree && (
          <Box
            sx={{
              pb: 2,
              width: '100%',
            }}>
            {Empty || (
              <Tree
                data={resources[component.meta.did] || []}
                value={selectedResourceIds[component.meta.did] || []}
                onChange={handleTreeChange}
                disabled={loading || readOnly}
              />
            )}
          </Box>
        )}
      </Container>
      {!!error && (
        <Box
          sx={{
            color: 'error.main',
            mt: 1,
            fontSize: 14,
          }}>
          {error}
        </Box>
      )}
    </>
  );
}
ResourceSelect.propTypes = {
  component: PropTypes.object.isRequired,
  app: PropTypes.object.isRequired,
  projectId: PropTypes.string.isRequired,
  error: PropTypes.string,
  saveSelectedEventsRef: PropTypes.object.isRequired,
  readOnly: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  release: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string,
  }),
  initialResources: PropTypes.object,
  initUrl: PropTypes.object,
  setResourceComponentsMap: PropTypes.func,
  componentDid: PropTypes.string,
  selectedResourceIds: PropTypes.object.isRequired,
  setSelectedResourceIds: PropTypes.func.isRequired,
  showTree: PropTypes.bool.isRequired,
};

const Container = styled(Box)`
  border: 1px solid;
  border-color: ${({ theme }) => theme.palette.divider};
  max-height: 600px;
  width: 100%;
  &.error {
    border-color: ${({ theme }) => theme.palette.error.main};
  }
  border-radius: 4px;
  padding: 16px;
  padding-bottom: 0px;
  overflow-y: auto;
  .footer {
    border-top: 1px solid #ddd;
    display: flex;
    padding: 12px 0;
    margin-top: 12px;
    position: sticky;
    bottom: 0;
    background: #fff;
    z-index: 10;
  }
`;
