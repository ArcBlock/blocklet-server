import styled from '@emotion/styled';
import classnames from 'classnames';
import pick from 'lodash/pick';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

import Datatable from '@arcblock/ux/lib/Datatable';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import LaunchIcon from '@mui/icons-material/Launch';

import { EmptyIcon } from '@arcblock/icons';
import { Alert } from '@mui/material';
import BlockletBundleAvatar from '../../bundle-avatar';
import StopBox from './stop-box';

export default function SelectBlocklets({
  value = [],
  app,
  onChange = () => {},
  onChangeBlockletResourceType = () => {},
  disabled = false,
  resourceRelateComponents = {},
  projectType,
  dependentComponentsMode = 'auto',
  blockletResourceType = '',
}) {
  const { t, locale } = useLocaleContext();
  const readonlyComponents = dependentComponentsMode === 'readonly';

  const components = useMemo(() => {
    const valueToMap = value.reduce((acc, curr) => {
      acc[curr.did] = curr.included;
      return acc;
    }, {});
    return (app.children || []).filter((component) => {
      if (readonlyComponents) {
        return resourceRelateComponents[component.meta.did] || valueToMap[component.meta.did];
      }
      return true;
    });
  }, [app.children, value, resourceRelateComponents, readonlyComponents]);

  const list = useMemo(
    () =>
      components.map((component) => {
        const exist = value.find((item) => item.did === component.meta.did);
        return exist || { did: component.meta.did };
      }),
    [components, value]
  );

  const map = list.reduce((acc, curr) => {
    acc[curr.did] = pick(curr, ['required', 'included']);
    return acc;
  }, {});

  const toggleIncluded = (did) => {
    const newValue = list.map((item) => {
      if (item.did === did) {
        const included = !item.included;
        return {
          ...item,
          included,
          required: included,
        };
      }
      return item;
    });
    onChange(newValue);
  };
  const toggleRequired = (did) => {
    const newValue = list.map((item) => {
      if (item.did === did) {
        return {
          ...item,
          required: !item.required,
        };
      }
      return item;
    });
    onChange(newValue);
  };

  const handleChangeBlockletResourceType = (e) => {
    onChangeBlockletResourceType(e.target.checked ? 'resource' : '');
  };

  const columns = [
    {
      label: t('common.name'),
      name: 'meta.title',
      width: 200,
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite: (rawIndex) => {
          const component = components[rawIndex];
          const included = map[component.meta.did]?.included;
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}>
              <BlockletBundleAvatar size={24} blocklet={component} ancestors={[app]} />
              <Box
                className={classnames('text', { excluded: !included })}
                sx={{
                  ml: '4px',
                }}>
                <Box>{component.meta.title}</Box>
              </Box>
            </Box>
          );
        },
      },
    },
    {
      label: t('blocklet.publish.componentIncluded'),
      width: 100,
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite: (rawIndex) => {
          const component = components[rawIndex];
          const isDefault = resourceRelateComponents[component.meta.did];
          const included = !!map[component.meta.did]?.included;
          return (
            <Checkbox
              size="small"
              checked={isDefault || included}
              onClick={() => toggleIncluded(component.meta.did)}
              disabled={readonlyComponents || isDefault || disabled}
            />
          );
        },
      },
    },
    {
      label: t('blocklet.publish.componentForceRequired'),
      width: 100,
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite: (rawIndex) => {
          const component = components[rawIndex];
          const isDefault = resourceRelateComponents[component.meta.did];
          const included = !!map[component.meta.did]?.included;
          const required = !!map[component.meta.did]?.required;
          return (
            <Checkbox
              size="small"
              checked={isDefault || (required && included)}
              onClick={() => toggleRequired(component.meta.did)}
              disabled={readonlyComponents || isDefault || disabled || !included}
            />
          );
        },
      },
    },
  ];

  return (
    <Root>
      {components?.length ? (
        <>
          <Alert severity="info" style={{ width: '100%' }}>
            <Box
              rel="noreferrer"
              sx={{
                display: 'flex',
                alignItems: 'center',
                ml: '13px',
              }}>
              {projectType === 'pack' ? t('blocklet.publish.packTip') : t('blocklet.publish.resourceTip')}
              <Box
                component="a"
                target="_blank"
                href={
                  projectType === 'pack'
                    ? 'https://www.arcblock.io/docs/blocklet-developer/en/5PXToZve-5IXAN1bc8rkpxAc'
                    : 'https://www.arcblock.io/docs/blocklet-developer/en/hB5VWLfg9VnbWsL1JGLuLUfW'
                }>
                <LaunchIcon sx={{ marginLeft: 1 }} />
              </Box>
            </Box>
            <Box component="label" style={{ cursor: 'pointer' }}>
              <Checkbox
                size="small"
                style={{ marginLeft: '0px' }}
                disabled={disabled}
                checked={blockletResourceType === 'resource'}
                onChange={handleChangeBlockletResourceType}
              />
              {t('blocklet.publish.forceResourceBlocklet')}
            </Box>
          </Alert>
          <Datatable
            className="main-table"
            verticalKeyWidth={100}
            locale={locale}
            data={components}
            columns={columns}
            options={{
              sort: false,
              download: false,
              filter: false,
              print: false,
              search: false,
              rowsPerPage: 50,
            }}
          />
        </>
      ) : (
        <StopBox Icon={EmptyIcon}>{t('blocklet.publish.blockletEmptyTip')}</StopBox>
      )}
    </Root>
  );
}

SelectBlocklets.propTypes = {
  app: PropTypes.object.isRequired,
  value: PropTypes.arrayOf(
    PropTypes.shape({
      did: PropTypes.string.isRequired,
      required: PropTypes.bool,
      included: PropTypes.bool,
    })
  ),
  onChange: PropTypes.func,
  onChangeBlockletResourceType: PropTypes.func,
  disabled: PropTypes.bool,
  dependentComponentsMode: PropTypes.string,
  resourceRelateComponents: PropTypes.object,
  blockletResourceType: PropTypes.string,
  projectType: PropTypes.string.isRequired,
};

const Root = styled(Box)`
  .main-table {
    .text.excluded {
      color: ${({ theme }) => theme.palette.grey[400]};
    }
    width: 400px;
    ${({ theme }) => theme.breakpoints.down('md')} {
      width: 100%;
    }
    > div:first-child {
      display: none;
    }
    .MuiTableCell-head {
      padding-top: 0;
      padding-bottom: 0;
    }
    .MuiTableCell-body {
      padding-top: 6px;
      padding-bottom: 6px;
    }
    .datatable-footer {
      display: none;
    }
    ${({ theme }) => theme.breakpoints.down('md')} {
      .MuiTableRow-root {
        border-color: ${({ theme }) => theme.palette.divider};
      }
    }
  }
`;
