import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useContext } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { Badge, Box } from '@mui/material';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import Dialog from '@arcblock/ux/lib/Dialog';
import { getDisplayName, hasStartEngine, isBlockletRunning } from '@blocklet/meta/lib/util';
import { formatPerson } from '@blocklet/meta/lib/fix';
import ExternalLink from '@mui/material/Link';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';

import { useDeletingBlockletContext } from '../../contexts/deleting-blocklets';
import Tag from '../../tag';
import DidAddress from '../../did-address';
import BlockletSource from '../blocklet-source';
import BlockletStatus from '../status';
import BlockletVersion from '../version';
import BlockletOwnerInfo from './blocklet-owner-info';

const isResource = (component) => !component?.meta?.group;

const getEngineRows = (engine, t) => {
  if (!engine) {
    return [];
  }
  return [
    {
      name: t('common.name'),
      value: engine.displayName,
    },
    {
      name: t('common.description'),
      value: engine.description,
    },
    {
      name: t('common.version'),
      value: <Tag>{engine.version}</Tag>,
    },
  ];
};

const getSourceInfo = (blocklet) => {
  const { source, deployedFrom, bundleSource } = blocklet;

  if (source) {
    return { source, deployedFrom };
  }

  if (!bundleSource) {
    return { source: 'upload', deployedFrom };
  }

  if (bundleSource.url) {
    const deployedAddress = deployedFrom || Array.isArray(bundleSource.url) ? bundleSource.url[0] : bundleSource.url;
    return {
      source: 'url',
      deployedFrom: deployedAddress,
      link: deployedAddress,
    };
  }

  if (bundleSource.store) {
    const deployedAddress =
      deployedFrom || Array.isArray(bundleSource.store) ? bundleSource.store[0] : bundleSource.store;
    return {
      source: 'registry',
      deployedFrom: deployedAddress,
      link: deployedAddress,
    };
  }

  return {};
};

const getComponentName = (componentId, app) => {
  const ids = componentId.split('/').slice(1);
  let parent = app;
  let index = 0;
  const names = [];
  while (parent && index < ids.length) {
    // eslint-disable-next-line no-loop-func
    const component = parent.children.find((x) => x.meta.did === ids[index]);
    parent = component;
    index++;
    if (component) {
      names.push(component.meta.title);
    }
  }
  return names.join(' / ');
};

export default function ComponentInfoDialog({ blocklet, depth = 0, componentInfo = null, app = null, onClose }) {
  const { t, locale } = useContext(LocaleContext);

  const { deletingBlocklets: deletingComponents } = useDeletingBlockletContext();

  // eslint-disable-next-line prefer-const
  let { status, greenStatus } = blocklet;
  if (status === 'running' || greenStatus === 'running') {
    status = 'running';
  }
  if (depth === 1 && deletingComponents.includes(blocklet.meta.did)) {
    status = 'deleting';
  }

  const mountPoint = `/${blocklet.mountPoint || '/'}`.replace(/\/+/g, '/');

  const renderRows = (rows) =>
    rows.map((row) => {
      if (row.name === t('common.did') || row.name === t('blocklet.appId')) {
        return (
          <InfoRow valueComponent="div" key={row.name} nameWidth={120} name={row.name} nameFormatter={() => row.name}>
            {row.value}
          </InfoRow>
        );
      }

      return (
        <InfoRow valueComponent="div" key={row.name} nameWidth={120} name={row.name}>
          {row.link ? (
            <ExternalLink href={row.link} target="_blank" className="page-link" underline="hover">
              {row.value}
            </ExternalLink>
          ) : (
            row.value
          )}
        </InfoRow>
      );
    });

  const sourceInfo = componentInfo ? getSourceInfo(componentInfo) : {};

  const componentRows = componentInfo
    ? [
        { name: t('common.name'), value: getDisplayName(componentInfo, true) },
        {
          name: t('common.version'),
          value: <BlockletVersion blocklet={componentInfo} checkUpgrade={false} />,
        },
        {
          name: t('common.status'),
          value: (
            <BlockletStatus
              isResource={isResource(blocklet)}
              status={status}
              source={componentInfo.source}
              progress={blocklet.progress}
            />
          ),
        },
        isBlockletRunning(blocklet)
          ? {
              name: t('blocklet.startedAt'),
              value: blocklet.startedAt ? <RelativeTime value={blocklet.startedAt} type="all" locale={locale} /> : '-',
            }
          : null,
        !isBlockletRunning(blocklet)
          ? {
              name: t('blocklet.stoppedAt'),
              value: blocklet.stoppedAt ? <RelativeTime value={blocklet.stoppedAt} type="all" locale={locale} /> : '-',
            }
          : null,
        blocklet.installedAt
          ? {
              name: t('blocklet.installedAt'),
              value: blocklet.installedAt ? (
                <RelativeTime value={blocklet.installedAt} type="all" locale={locale} />
              ) : (
                '-'
              ),
            }
          : null,
        hasStartEngine(blocklet.meta)
          ? {
              name: t('common.mountPoint'),
              value: mountPoint,
            }
          : null,
        componentInfo.meta.group
          ? {
              name: t('common.group'),
              value: <Tag type="success">{componentInfo.meta.group}</Tag>,
            }
          : null,
        {
          name: t('blocklet.overview.source'),
          value: <BlockletSource sourceInfo={sourceInfo} blocklet={blocklet} />,
        },
        {
          name: t('blocklet.overview.deployedFrom'),
          value: sourceInfo.deployedFrom || '-',
          link: sourceInfo.link ?? '',
        },
        { name: t('common.did'), value: <DidAddress did={componentInfo.meta.did} showQrcode /> },
        {
          name: t('common.author'),
          value: componentInfo.meta.owner ? (
            <BlockletOwnerInfo owner={componentInfo.meta.owner} locale={locale} />
          ) : (
            formatPerson(componentInfo.meta.author)
          ),
        },
        {
          name: t('common.engine'),
          value: getEngineRows(componentInfo.engine, t).map(({ name, value }) => (
            <InfoRow style={{ marginBottom: 4 }} key={name} nameWidth={120} name={name}>
              {value}
            </InfoRow>
          )),
        },
        blocklet.dependents?.length
          ? {
              name: t('common.dependents'),
              value: (
                <Box>
                  {blocklet.dependents.map((x) => (
                    <Box key={x.id}>
                      {`${getComponentName(x.id, app)} ${x.required ? `(${t('common.required')})` : ''}`}
                    </Box>
                  ))}
                </Box>
              ),
            }
          : null,
        blocklet.meta.resources?.length
          ? { name: t('common.resource'), value: blocklet.meta.resources.join(', ') }
          : null,
      ].filter(Boolean)
    : [];

  if (!componentInfo) {
    return null;
  }

  return (
    <Dialog
      open
      title={t('common.componentBasicInfo')}
      showCloseButton
      key="base-info-dialog"
      fullWidth
      maxWidth="md"
      onClose={() => {
        onClose(null);
      }}>
      <Box
        key="dialog-wrapper"
        sx={{
          paddingBottom: 1.5,
        }}>
        {renderRows(componentRows)}
      </Box>
    </Dialog>
  );
}

ComponentInfoDialog.propTypes = {
  blocklet: PropTypes.object.isRequired,
  depth: PropTypes.number,
  app: PropTypes.object,
  componentInfo: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export const StyledBadge = styled(Badge)`
  .BaseBadge-badge {
    top: ${(props) => props.top * 8 || 6}px;
    right: ${(props) => props.right * 8 || 6}px;
  }
`;

export const StyledComponentRow = styled(Box)`
  .component-header {
    display: flex;
    align-items: center;
    align-items: flex-end;
    cursor: pointer;
  }
  .component-name {
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 16px;
  }
  .component-version {
    color: ${({ theme }) => theme.palette.grey[400]};
    font-size: 12px;
    margin-left: 4px;
    transform: translateY(-1px);
  }
`;
