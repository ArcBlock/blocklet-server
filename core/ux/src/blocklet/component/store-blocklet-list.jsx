/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react/jsx-wrap-multilines */
import { ActionButton } from '@arcblock/ux/lib/Blocklet';
import Blocklet from '@arcblock/ux/lib/BlockletV2';
import Button from '@arcblock/ux/lib/Button';
import { ErrorFallback } from '@arcblock/ux/lib/ErrorBoundary';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import InnerList from '@blocklet/list';
import { isFreeBlocklet } from '@blocklet/meta/lib/util';
import styled from '@emotion/styled';
import Apps from '@iconify-icons/tabler/apps';
import BasketDollar from '@iconify-icons/tabler/basket-dollar';
import BrandDocker from '@iconify-icons/tabler/brand-docker';
import ChevronsUp from '@iconify-icons/tabler/chevrons-up';
import { Icon } from '@iconify/react';
import { Box, createTheme, ThemeProvider, useTheme } from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import semver from 'semver';
import { joinURL } from 'ufo';
import { mergeSx } from '@arcblock/ux/lib/Util/style';

import { useBlockletContext } from '../../contexts/blocklet';
import { formatRegistryLogoPath } from '../../util';
import CheckVersionButton from './check-version-button';

const getStoreDetail = (meta, endpoint) => {
  return joinURL(endpoint, `/blocklets/${meta.did}`);
};

// 如何需要显示头像，可以使用方法获取
// const getAvatar = (path, endpoint) => {
//   return joinURL(endpoint, path);
// };

const displayAttributes = ({ blocklet, attribute, value }) => {
  if (blocklet._formatted) {
    return blocklet._formatted[attribute];
  }
  return value;
};

const requirePurchase = (meta) => meta.inStore && isFreeBlocklet(meta) === false;

function BlockletItem({ blocklet, blocklets = [], handleButtonClick = null, endpoint = '', serverVersion = '' }) {
  const { t } = useLocaleContext();
  let logoUrl = joinURL(endpoint, formatRegistryLogoPath(blocklet.did, blocklet.logo || ''));
  try {
    const tempURL = new URL(logoUrl);
    tempURL.searchParams.set('v', blocklet.version || +new Date());
    logoUrl = tempURL.href;
  } catch {
    /* empty */
  }
  const [loading, setLoading] = useState(false);

  const onAction = async () => {
    try {
      setLoading(true);
      await handleButtonClick({ meta: blocklet, registryUrl: endpoint, blocklets });
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  const { blocklet: pageBlocklet } = useBlockletContext();

  const getCurrentVersion = () => {
    const exist = (pageBlocklet?.children || []).find((x) => x.meta.bundleDid === blocklet.did);
    const currentVersion = exist.meta.version;
    return currentVersion;
  };

  const getInstallOrUpgrade = () => {
    const exist = (pageBlocklet?.children || []).find((x) => x.meta.bundleDid === blocklet.did);
    if (exist) {
      try {
        const currentVersion = exist.meta.version;
        const targetVersion = blocklet.version;
        if (semver.gt(targetVersion, currentVersion)) {
          return 'upgrade';
        }
      } catch {
        // 如果比对版本报错，则还是允许安装
        return 'install';
      }
      return 'disable';
    }
    return 'install';
  };

  const actionType = getInstallOrUpgrade();
  const requirementVersion = blocklet.requirements?.server;

  const status = [];
  if (actionType === 'upgrade') {
    status.push({
      key: 'upgrade',
      icon: <Icon key="version" icon={ChevronsUp} color="success.light" width={20} height={20} />,
      title: `${getCurrentVersion()} -> ${blocklet.version}`,
      align: 'right',
      color: 'success.light',
      maxWidth: 300,
      text: <Box sx={{ fontWeight: 'bold' }}>{t('blocklet.component.upgradeAvailable')}</Box>,
    });
  } else if (actionType === 'disable') {
    status.push({
      key: 'disable',
      icon: <Icon key="disable" icon={Apps} color="text.disabled" width={20} height={20} />,
      align: 'right',
      maxWidth: 300,
      color: 'text.disabled',
      text: t('blocklet.component.installed'),
    });
  } else if (requirePurchase(blocklet)) {
    status.push({
      key: 'purchase',
      icon: <Icon key="purchase" icon={BasketDollar} color="primary.main" width={20} height={20} />,
      align: 'right',
      maxWidth: 300,
      color: 'primary.main',
      text: t('blocklet.component.needBuy'),
    });
  }

  return (
    <StyledBlocklet
      title={displayAttributes({ blocklet, attribute: 'title', value: blocklet.title || blocklet.name })}
      did={blocklet.did}
      description={displayAttributes({ blocklet, attribute: 'description', value: blocklet.description })}
      cover={blocklet.logo ? logoUrl : ''}
      version={blocklet.version}
      onButtonClick={null}
      data-cy="install-blocklet"
      sx={
        actionType !== 'disable'
          ? {
              '&:hover, && *': {
                cursor: 'pointer',
              },
            }
          : {
              '&:after, &:before': {
                content: '""',
                opacity: '0 !important',
              },
            }
      }
      onMainClick={actionType === 'disable' ? undefined : onAction}
      icons={
        blocklet.docker?.image
          ? [
              {
                key: 'docker',
                icon: (
                  <Box
                    sx={{
                      display: 'flex',
                      color: 'primary.main',
                    }}>
                    <Icon icon={BrandDocker} />
                  </Box>
                ),
                title: t('blocklet.dockerImage'),
              },
            ]
          : []
      }
      official={blocklet.isOfficial ? { tooltip: t('blocklet.component.isOfficial') } : undefined}
      download={blocklet.stats.downloads}
      status={status}
      button={
        <CheckVersionButton serverVersion={serverVersion} requirementVersion={requirementVersion} size="small">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ActionButton>
              <Button
                key={blocklet.did}
                size="small"
                disabled={loading}
                variant="outlined"
                color="primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const url = getStoreDetail(blocklet, endpoint);
                  if (url) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                }}>
                {t('common.detail')}
              </Button>
            </ActionButton>
          </div>
        </CheckVersionButton>
      }
    />
  );
}

BlockletItem.propTypes = {
  blocklet: PropTypes.object.isRequired,
  blocklets: PropTypes.array,
  handleButtonClick: PropTypes.func,
  endpoint: PropTypes.string,
  serverVersion: PropTypes.string,
};

export default function BlockletList({
  handleButtonClick = null,
  handleSearchSelect = null,
  storeUrl,
  handleBlockletRender = null,
  extraFilter = undefined,
  serverVersion = '',
  resourceType = '',
  resourceDid = '',
  showResourcesSwitch = true,
  showCategory = true,
  compact = false,
  ...rest
}) {
  const blockletTheme = useTheme();
  const { locale } = useLocaleContext();
  const [initialized, setInitialized] = useState(false);
  const [filters, setFilters] = useState({});
  const handleChange = (changeData) => {
    setFilters(changeData);
  };

  const endpoint = storeUrl;
  const theme = useMemo(
    () =>
      createTheme(blockletTheme, {
        palette: {
          background: {
            default: blockletTheme.palette.background.paper,
          },
        },
      }),
    [blockletTheme]
  );

  useEffect(() => {
    setFilters({
      showResources: true,
      resourceType,
      resourceDid,
    });
  }, [endpoint, resourceType, resourceDid]);

  useEffect(() => {
    setInitialized(true);
    setFilters({
      showResources: true,
      resourceType,
      resourceDid,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[endpoint]}>
        <Box {...rest} sx={mergeSx({ overflow: 'auto', '.title-bar + div': { height: 'unset' } }, rest.sx)}>
          {initialized && (
            <InnerList
              showCategory={showCategory}
              // layout={{ showCategory: false }}
              showResourcesSwitch={showResourcesSwitch}
              blockletRender={(blockletRenderProps) => {
                const defaultProps = {
                  ...blockletRenderProps,
                  handleButtonClick,
                  endpoint,
                };
                return handleBlockletRender({
                  ...blockletRenderProps,
                  defaultRender: <BlockletItem {...defaultProps} />,
                });
              }}
              compact={compact}
              minItemWidth={300}
              baseSearch
              endpoint={endpoint}
              locale={locale}
              onFilterChange={handleChange}
              onSearchSelect={handleSearchSelect}
              filters={filters}
              extraFilter={extraFilter}
              serverVersion={serverVersion}
              fetchCategoryDelay={500}
            />
          )}
          <Box sx={{ mt: 2 }}> </Box>
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

BlockletList.propTypes = {
  storeUrl: PropTypes.string.isRequired,
  handleButtonClick: PropTypes.func,
  handleSearchSelect: PropTypes.func,
  handleBlockletRender: PropTypes.func,
  extraFilter: PropTypes.func,
  serverVersion: PropTypes.string,
  resourceType: PropTypes.string,
  resourceDid: PropTypes.string,
  showResourcesSwitch: PropTypes.bool,
  showCategory: PropTypes.bool,
  compact: PropTypes.bool,
};

const StyledBlocklet = styled(Blocklet)`
  .ms-highlight {
    color: ${(props) => props.theme.palette.primary.main};
  }
`;
