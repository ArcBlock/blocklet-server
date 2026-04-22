/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react/jsx-wrap-multilines */
import { ErrorFallback } from '@arcblock/ux/lib/ErrorBoundary';
import InnerList from '@blocklet/list';
import styled from '@emotion/styled';
import Link from '@mui/material/Link';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { joinURL } from 'ufo';
import { Icon } from '@iconify/react';
import BrandDocker from '@iconify-icons/tabler/brand-docker';

import CheckVersionButton from '@abtnode/ux/lib/blocklet/component/check-version-button';
import { getServerUrl } from '@abtnode/ux/lib/blocklet/util';
import Blocklet from '@arcblock/ux/lib/BlockletV2';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { hasMountPoint, hasStartEngine, isGatewayBlocklet, isPackBlocklet } from '@blocklet/meta/lib/engine';
import { Box } from '@mui/material';
import { useNodeContext } from '../../contexts/node';
import { formatRegistryLogoPath } from '../../libs/util';
import InstallButton from './install';

const getStoreDetail = (meta, info, endpoint) => {
  const serverUrl = getServerUrl(info);
  return joinURL(endpoint, `/blocklets/${meta.did}/?server-url=${serverUrl}`);
};

const displayAttributes = ({ meta, attribute, value }) => {
  if (meta._formatted) {
    return meta._formatted[attribute];
  }
  return value;
};

const getAvatar = (path, endpoint) => {
  if (!path || !endpoint) {
    return '';
  }
  try {
    return joinURL(endpoint, path);
  } catch (err) {
    console.warn('Failed to construct avatar URL:', err);
    return '';
  }
};

function BlockletItem({ blocklet: meta, endpoint = '', serverVersion = '' }) {
  // eslint-disable-next-line no-console
  const { t } = useLocaleContext();
  const node = useNodeContext();

  let logoUrl = joinURL(node.imgPrefix, 'blocklet.png');

  const storeUrl = endpoint;

  if (storeUrl.startsWith('http') && meta.logo) {
    logoUrl = joinURL(storeUrl, formatRegistryLogoPath(meta.did, meta.logo, meta.version));
  } else {
    const prefix = window.env.apiPrefix || '/';
    let apiPrefix = prefix.replace(/^\/+/, '').replace(/\/+$/, '');
    if (apiPrefix) {
      apiPrefix = `/${apiPrefix}`;
    }
    logoUrl = joinURL(apiPrefix, `/blocklet/logo/${meta.did}`);
  }

  try {
    const tempURL = new URL(logoUrl);
    tempURL.searchParams.set('v', meta.version || +new Date());
    logoUrl = tempURL.href;
  } catch {
    /* empty */
  }

  const onClickLink = e => {
    if (!e.currentTarget.contains(e.target)) {
      e.preventDefault();
      return false;
    }
    return true;
  };

  const buttonProps = {
    meta,
    buttonText: {
      purchase: t('common.purchase'),
      launch: t('common.launch'),
    },
    storeUrl,
  };

  const button = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <CheckVersionButton serverVersion={serverVersion} requirementVersion={meta.requirements?.server} size="small">
        <InstallButton
          isResource={!(hasStartEngine(meta) || isGatewayBlocklet(meta) || isPackBlocklet(meta) || hasMountPoint(meta))}
          {...buttonProps}
        />
      </CheckVersionButton>
    </div>
  );

  return (
    <Link
      href={getStoreDetail(meta, node.info, endpoint)}
      style={{ color: 'initial', textDecoration: 'none' }}
      onClick={onClickLink}
      target="_blank">
      <StyledBlocklet
        title={displayAttributes({ meta, attribute: 'title', value: meta.title || meta.name })}
        did={meta.did}
        description={displayAttributes({ meta, attribute: 'description', value: meta.description })}
        cover={meta.logo ? logoUrl : ''}
        version={meta.version}
        onButtonClick={null}
        icons={
          meta.docker?.image
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
        official={meta.isOfficial ? { tooltip: t('blocklet.component.isOfficial') } : undefined}
        author={meta.owner.fullName}
        avatar={getAvatar(meta.owner.avatar, endpoint)}
        download={meta.stats.downloads}
        button={button}
      />
    </Link>
  );
}
BlockletItem.propTypes = {
  blocklet: PropTypes.object.isRequired,
  serverVersion: PropTypes.string,
  endpoint: PropTypes.string,
};

export default function BlockletList({ storeUrl, handleSearchSelect = null, extraFilter = undefined, ...rest }) {
  const { locale } = useLocaleContext();
  const node = useNodeContext();
  const [filters, setFilters] = useState({});
  const handleChange = changeData => {
    setFilters(changeData);
  };

  const endpoint = storeUrl;
  const serverVersion = node?.info?.version;

  useEffect(() => {
    setFilters({});
  }, [endpoint]);
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[endpoint]}>
      <Box {...rest} sx={{ '& .title-bar': { pt: 0 }, '.blocklet-list': { mt: 0 }, '& h2': { display: 'none' } }}>
        <InnerList
          layout={{ showExplore: false, showTitle: true }}
          blockletRender={blockletRenderProps => <BlockletItem {...blockletRenderProps} endpoint={endpoint} />}
          baseSearch
          endpoint={endpoint}
          locale={locale}
          onFilterChange={handleChange}
          onSearchSelect={handleSearchSelect}
          filters={filters}
          extraFilter={extraFilter}
          serverVersion={serverVersion}
        />
      </Box>
    </ErrorBoundary>
  );
}

BlockletList.propTypes = {
  storeUrl: PropTypes.string.isRequired,
  handleSearchSelect: PropTypes.func,
  extraFilter: PropTypes.func,
};

const StyledBlocklet = styled(Blocklet)`
  .ms-highlight {
    color: ${props => props.theme.palette.primary.main};
  }
`;
