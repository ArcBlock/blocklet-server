/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react/prop-types */
import { useContext } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import mapValues from 'lodash/mapValues';

// FIXME: anyone 需要移除旧版本的依赖
import MaterialTable from '@material-table/core';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material';
import { BLOCKLET_CONFIGURABLE_KEY, CHAIN_PROP_MAP } from '@blocklet/constant';
import { getComponentMissingConfigs, getSharedConfigObj, isEnvShareable } from '@blocklet/meta/lib/util';
import { escapeTag } from '@abtnode/util/lib/sanitize';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { formatError } from '@blocklet/error';

import Toast from '@arcblock/ux/lib/Toast';
import ClickToCopy from '../../click-to-copy';
import { useNodeContext } from '../../contexts/node';
import TableStyle from '../../table';
import Permission from '../../permission';
import { isInstalling, isValidClusterSize, BlockletAdminRoles } from '../../util';
import tableIcons from '../../table-icons';
import blockletIcons from '../icons';

function withPrimaryText(Component) {
  function ColoredIcon({ sx, ...rest }) {
    return <Component {...rest} sx={{ color: 'text.primary', ...sx }} />;
  }
  return ColoredIcon;
}

// 合并两个图标集合
const icons = { ...mapValues(tableIcons, withPrimaryText), ...mapValues(blockletIcons, withPrimaryText) };

const getDescription = (data, t) => {
  let { description } = data;
  if (Object.values(CHAIN_PROP_MAP).includes(data.key) || isEnvShareable(data)) {
    if (description) {
      description = `${description} (${t('blocklet.config.sharedToAllComponents')})`;
    } else {
      description = t('blocklet.config.sharedToAllComponents');
    }
  }
  return description && <div style={{ marginLeft: 12 }}>{description}</div>;
};

const isCustom = (env, blocklet, ancestors = []) => {
  if (
    !ancestors?.length && // is container
    !env.custom && // is not manual
    !['CHAIN_ID', 'CHAIN_HOST'].includes(env.key) &&
    !blocklet.meta.environments.find((y) => y.name === env.key) && // is not declared in blocklet.yml
    blocklet.children.every((child) => !child.meta.environments.find((y) => y.name === env.key)) // is not declared in all children
  ) {
    return true;
  }
  return env.custom;
};

const isValidKey = (key) => {
  if ([BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_CLUSTER_SIZE].includes(key)) {
    return true;
  }

  if (key.startsWith('BLOCKLET_') || key.startsWith('COMPONENT_')) {
    return false;
  }

  return true;
};

const isCustomKey = (key) => [BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_CLUSTER_SIZE].includes(key) === false;

export default function ComponentEnvironment({ blocklet, ancestors = [] }) {
  const node = useNodeContext();
  const { palette } = useTheme();
  const { inService } = node;
  const { t } = useContext(LocaleContext);
  const dids = [...ancestors.map((x) => x.meta.did), blocklet.meta.did];

  const onConfigChanged = () => Toast.success(t('blocklet.config.changedTip'));

  const isConfigEditable = (x) => isCustom(x, blocklet, ancestors);

  if (isInstalling(blocklet.status)) {
    return null;
  }

  if (blocklet.status === 'unknown' && isInstalling(blocklet.status)) {
    return null;
  }

  const onAddConfig = (data) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if (!data.key.trim() || !data.value.trim()) {
        Toast.error(t('blocklet.config.environment.keyValueRequired'));
        reject();
        return;
      }

      if (isValidKey(data.key) === false) {
        Toast.error(t('blocklet.config.environment.invalidKey'));
        reject();
        return;
      }

      data.custom = isCustomKey(data.key);

      try {
        const result = await node.api.configBlocklet({ input: { did: dids, configs: [data] } });
        onConfigChanged(result.blocklet);
        resolve();
      } catch (err) {
        Toast.error(formatError(err));
        reject();
      }
    });
  };

  const onEditConfig = (newData, oldData) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if (newData.required && (!newData.key.trim() || !newData.value.trim())) {
        Toast.error(t('blocklet.config.environment.keyValueRequired'));
        reject();
        return;
      }

      if (isValidKey(newData.key) === false) {
        Toast.error(t('blocklet.config.environment.invalidKey'));
        reject();
        return;
      }

      if (newData.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_CLUSTER_SIZE) {
        const errMessage = isValidClusterSize(newData);
        if (errMessage) {
          Toast.error(errMessage);
          reject();
          return;
        }
      }

      const configs = [
        {
          ...newData,
          value: newData.secure && newData.value === '__encrypted__' ? '' : newData.value,
        },
      ];

      if (newData.key !== oldData.key) {
        if (!isCustom(newData, blocklet, ancestors)) {
          Toast.error('Only key of custom env can be changed');
          reject();
          return;
        }

        configs.push({ key: oldData.key, custom: isCustomKey(newData.key) });
      }

      try {
        const result = await node.api.configBlocklet({
          input: { did: dids, configs },
        });
        onConfigChanged(result.blocklet);
        resolve();
      } catch (err) {
        Toast.error(formatError(err));
        reject();
      }
    });
  };

  const onDeleteConfig = (data) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if (data.required) {
        Toast.error(t('blocklet.config.environment.deleteForbidden'));
        reject();
        return;
      }

      if (!isCustom(data, blocklet, ancestors)) {
        Toast.error(t('environmentTips.deleteForbidden'));
        reject();
        return;
      }

      try {
        const result = await node.api.configBlocklet({
          input: { did: dids, configs: [{ key: data.key, custom: isCustomKey(data.key) }] },
        });
        onConfigChanged(result.blocklet);
        resolve();
      } catch (err) {
        Toast.error(formatError(err));
        reject();
      }
    });
  };

  // configs
  const componentConfigs = (blocklet.configs || []).filter(
    (x) => !BLOCKLET_CONFIGURABLE_KEY[x.key] || [BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_CLUSTER_SIZE].includes(x.key)
  );
  const sharedConfigObj = getSharedConfigObj(ancestors[0], blocklet);
  const missingRequiredConfigs = getComponentMissingConfigs(blocklet, ancestors[0]);

  const configs = componentConfigs.map((x) => ({
    ...x,
    value:
      Object.values(CHAIN_PROP_MAP).includes(x.key) && Object.keys(sharedConfigObj).includes(x.key)
        ? sharedConfigObj[x.key]
        : sharedConfigObj[x.key] || x.value,
  }));

  const hasBWAConfig = configs.some((x) => x.key && x.key.startsWith('BWA_'));

  const action = {
    onRowAdd: onAddConfig,
    onRowUpdate: onEditConfig,
    onRowDelete: onDeleteConfig,
    // environment declare in blocklet.yml can't be deleted, only custom env can be deleted
    isDeletable: isConfigEditable,
  };

  const onColumns = () => [
    {
      title: t('common.key'),
      field: 'key',
      initialEditValue: '',
      width: '30%',
      render: (d) => (
        <ClickToCopy
          value={d.value}
          style={{
            color: d.required && !d.value ? palette.error.main : palette.text.primary,
            fontWeight: d.required ? 'bold' : 'normal',
          }}>
          {d.key}
        </ClickToCopy>
      ),
      editComponent: (props) => {
        const { value, rowData, onChange } = props;
        return (
          <EditDiv>
            <TextField
              fullWidth
              size="small"
              value={escapeTag(value)}
              onChange={(e) => onChange(e.target.value)}
              variant="outlined"
              label="Key"
              placeholder={t('blocklet.config.environment.key')}
              margin="dense"
              autoFocus
              slotProps={{
                input: { readOnly: isConfigEditable(rowData) === false },
              }}
            />
          </EditDiv>
        );
      },
    },
    {
      title: t('common.value'),
      field: 'value',
      initialEditValue: '',
      width: 'calc((100% - (96px + 30%)) / 1)',
      render: (d) => {
        if (!d.value) {
          return null;
        }

        if (d.secure) {
          return '******';
        }

        return (
          <ClickToCopy unstyled value={d.value} style={{ wordBreak: 'break-all' }}>
            {d.value}
          </ClickToCopy>
        );
      },
      editComponent: (props) => {
        const { value, rowData, onChange } = props;

        return (
          <EditDiv>
            <TextField
              fullWidth
              size="small"
              value={value === '__encrypted__' ? '' : value}
              onChange={(e) => onChange(e.target.value)}
              variant="outlined"
              label={t('common.value')}
              placeholder={t('blocklet.config.environment.value')}
              margin="dense"
            />
            {getDescription(rowData, t)}
          </EditDiv>
        );
      },
    },
  ];

  return (
    <Div>
      {!!missingRequiredConfigs.length && (
        <Alert severity="error" style={{ marginTop: 24 }}>
          {t('blocklet.config.missingRequired')}
        </Alert>
      )}
      {hasBWAConfig && <Alert severity="info">{t('blocklet.config.environment.tip')}</Alert>}
      <Permission permission={inService ? '' : 'mutate_blocklets'} role={inService ? BlockletAdminRoles : []}>
        {(hasPermission) => (
          <TableStyle className="config-table">
            <MaterialTable
              title={
                <Box
                  sx={{
                    fontWeight: 'bold',
                  }}>
                  {t('common.environments')}
                </Box>
              }
              columns={onColumns()}
              icons={icons}
              options={{
                emptyRowsWhenPaging: false,
                actionsColumnIndex: -1,
                tableLayout: 'auto',
                maxBodyHeight: '100%',
                paging: false,
                search: false,
                actionsCellStyle: {
                  padding: '0',
                  textAlign: 'right',
                  width: '80px',
                },
              }}
              localization={{
                header: {
                  actions: t('common.actions'),
                },
                body: {
                  emptyDataSourceMessage: t('common.noData'),
                  editRow: {
                    deleteText: t('environmentTips.delete'),
                  },
                },
              }}
              data={configs}
              editable={hasPermission ? action : {}}
            />
          </TableStyle>
        )}
      </Permission>
    </Div>
  );
}

ComponentEnvironment.propTypes = {
  blocklet: PropTypes.object.isRequired,
  ancestors: PropTypes.array,
};

const Div = styled.div`
  .config-table {
    margin-bottom: 24px;
    position: relative;
    .hide-control {
      position: absolute;
      top: 10px;
      left: 200px;
      @media (max-width: ${(props) => props.theme.breakpoints.values.sm}px) {
        left: 160px;
      }
    }

    .MuiToolbar-root {
      display: flex;
    }

    .MuiTableRow-head {
      display: none;
    }

    &.hide-header {
      .MuiToolbar-root {
        display: none;
      }
    }
  }

  .accordion {
    margin-bottom: 16px;
    &:last-of-type {
      margin-bottom: 0;
    }
    padding: 8px 0 8px 0px;
    &.MuiAccordion-root {
      background: transparent;
      box-shadow: none;
      border: 1px solid #ddd;
      border-radius: 4px;
      &::before,
      &::after {
        height: 0;
      }
      .MuiAccordionSummary-root {
        padding-left: 0;
      }
      .accordion-title {
        font-weight: bold;
        padding-left: 16px;
      }
    }
  }
`;

const EditDiv = styled.div`
  height: 60px;
`;
