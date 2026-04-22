import { useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useMemoizedFn, useRequest } from 'ahooks';
import Datatable from '@arcblock/ux/lib/Datatable';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useConfirm } from '@arcblock/ux/lib/Dialog';
import { joinURL } from 'ufo';
import Toast from '@arcblock/ux/lib/Toast';
import { useTheme } from '@arcblock/ux/lib/Theme';
import { SECURITY_RULE_DEFAULT_ID } from '@abtnode/constant';

import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';
import BlockletSecurityActions from './security-actions';
import BlockletSecurityItemDialog from './security-item-dialog';
import { echoError } from './dom-utils';

export default function BlockletSecurity() {
  const { t, locale } = useLocaleContext();
  const { blocklet } = useBlockletContext();
  const { api } = useNodeContext();
  const did = blocklet?.meta?.did;
  const theme = useTheme();

  const securityItemDialogRef = useRef(null);
  const datatableRef = useRef(null);
  const { confirmApi, confirmHolder } = useConfirm();

  const securityRuleState = useRequest(async () => {
    const { securityRules } = await api.getBlockletSecurityRules({ input: { did, includeDisabled: true } });
    return securityRules;
  });
  const checkIsDefault = (dataItem) => dataItem.id === SECURITY_RULE_DEFAULT_ID;

  const getMountPoint = useMemoizedFn((componentDid) => {
    const components = blocklet?.children || [];
    return components.find((item) => item.meta.did === componentDid)?.mountPoint;
  });

  const securityRuleData = (securityRuleState.data || []).map((item) => {
    if (item.componentDid) {
      const mountPoint = getMountPoint(item.componentDid);
      item._disabled = mountPoint === undefined;
    }
    return item;
  });
  const securityRuleDataWithoutDefault = securityRuleData.filter((x) => !checkIsDefault(x));

  const handleItemSwitch = useMemoizedFn((e, dataItem) => {
    echoError(async () => {
      const value = e.target.checked;
      await api.updateBlockletSecurityRule({
        input: { did, data: { id: dataItem.id, enabled: value } },
      });
      Toast.success(t('common.succeeded'));
      securityRuleState.run();
    });
  });
  const handleItemUp = useMemoizedFn((e, dataItem, rowIndex) => {
    echoError(async () => {
      const targetIndex = rowIndex - 1;
      const targetItem = securityRuleData[targetIndex];
      await Promise.all([
        api.updateBlockletSecurityRule({
          input: { did, data: { id: dataItem.id, priority: targetItem.priority } },
        }),
        api.updateBlockletSecurityRule({
          input: { did, data: { id: targetItem.id, priority: dataItem.priority } },
        }),
      ]);
      Toast.success(t('common.succeeded'));
      securityRuleState.run();
    });
  });
  const handleItemDown = useMemoizedFn((e, dataItem, rowIndex) => {
    echoError(async () => {
      const targetIndex = rowIndex + 1;
      const targetItem = securityRuleData[targetIndex];
      await Promise.all([
        api.updateBlockletSecurityRule({
          input: { did, data: { id: dataItem.id, priority: targetItem.priority } },
        }),
        api.updateBlockletSecurityRule({
          input: { did, data: { id: targetItem.id, priority: dataItem.priority } },
        }),
      ]);
      Toast.success(t('common.succeeded'));
      securityRuleState.run();
    });
  });
  const handleItemAdd = useMemoizedFn(() => {
    securityItemDialogRef.current.open(async (data, { close, done }) => {
      await echoError(async () => {
        await api.addBlockletSecurityRule({
          input: {
            did,
            data,
          },
        });
        Toast.success(t('common.succeeded'));
        securityRuleState.run();
        close();
      });
      done();
    });
  });
  const handleItemEdit = useMemoizedFn((e, dataItem) => {
    securityItemDialogRef.current.open(async (data, { close, done }) => {
      await echoError(async () => {
        await api.updateBlockletSecurityRule({
          input: { did, data: { ...data, id: dataItem.id } },
        });
        Toast.success(t('common.succeeded'));
        securityRuleState.run();
        close();
      });
      done();
    }, dataItem);
  });
  const handleItemDelete = useMemoizedFn((e, dataItem) => {
    confirmApi.open({
      title: t('securityRule.delete.title'),
      content: t('securityRule.delete.description'),
      confirmButtonText: t('common.confirm'),
      confirmButtonProps: {
        color: 'error',
      },
      cancelButtonText: t('common.cancel'),
      onConfirm(close) {
        echoError(async () => {
          await api.deleteBlockletSecurityRule({
            input: { did, id: dataItem.id },
          });
          Toast.success(t('common.succeeded'));
          securityRuleState.run();
          close();
        });
      },
    });
  });

  const handleItemView = useMemoizedFn((dataItem) => {
    securityItemDialogRef.current.open((_, { close, done }) => {
      done();
      close();
    }, dataItem);
  });

  const tableOptions = {
    sort: false,
    download: false,
    filter: false,
    print: false,
    search: false,
    viewColumns: false,
    expandableRowsOnClick: true,
    searchDebounceTime: 600,
    onRowClick(row, { dataIndex }, e) {
      if (datatableRef.current?.contains(e.target)) {
        const dataItem = securityRuleData[dataIndex];
        handleItemView(dataItem);
      }
    },
    setRowProps: (row, dataIndex) => {
      // 根据行数据条件设置样式
      const dataItem = securityRuleData[dataIndex];
      if (dataItem._disabled) {
        return {
          title: t('securityRule.useless'),
          style: {
            backgroundColor: theme.palette.action.disabledBackground,
            cursor: 'default',
          },
        };
      }
      return {};
    },
  };

  const customButtons = [
    <Button
      key="refresh"
      size="small"
      variant="outlined"
      onClick={() => {
        securityRuleState.run();
      }}
      sx={{
        mr: 1,
      }}>
      {t('common.refresh')}
    </Button>,
    <Button size="small" variant="contained" onClick={handleItemAdd}>
      {t('common.add')}
    </Button>,
  ];

  const columns = [
    {
      label: t('securityRule.form.pathPattern'),
      name: 'pathPattern',
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite(rowIndex) {
          const dataItem = securityRuleData[rowIndex];
          return (
            <Box sx={{ whiteSpace: 'nowrap' }}>
              {dataItem.id === SECURITY_RULE_DEFAULT_ID
                ? 'Default'
                : joinURL(getMountPoint(dataItem.componentDid), dataItem.pathPattern)}
            </Box>
          );
        },
      },
    },
    {
      label: t('responseHeaderPolicy.title'),
      name: 'responseHeaderPolicy',
      options: {
        customBodyRenderLite(rowIndex) {
          const dataItem = securityRuleData[rowIndex];
          return dataItem.responseHeaderPolicy?.name;
        },
      },
    },
    {
      label: t('accessPolicy.title'),
      name: 'accessPolicyId',
      options: {
        customBodyRenderLite(rowIndex) {
          const dataItem = securityRuleData[rowIndex];
          return dataItem.accessPolicy?.name;
        },
      },
    },
    {
      label: t('securityRule.form.remark'),
      name: 'remark',
    },
    {
      label: t('common.actions'),
      name: '',
      width: 100,
      align: 'center',
      verticalKeyAlign: 'center',
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite(rowIndex) {
          const dataItem = securityRuleData[rowIndex];
          const isDefault = checkIsDefault(dataItem);
          return (
            <BlockletSecurityActions
              disableEdit={dataItem._disabled}
              disableSwitch={dataItem._disabled}
              enabled={dataItem.enabled}
              showSwitch={!isDefault}
              showDelete={!isDefault}
              showUp={rowIndex > 0 && !isDefault}
              showDown={rowIndex < securityRuleDataWithoutDefault.length - 1 && !isDefault}
              onClickSwitch={(e) => {
                handleItemSwitch(e, dataItem, rowIndex);
              }}
              onClickUp={(e) => {
                handleItemUp(e, dataItem, rowIndex);
              }}
              onClickDown={(e) => {
                handleItemDown(e, dataItem, rowIndex);
              }}
              onClickEdit={(e) => {
                handleItemEdit(e, dataItem, rowIndex);
              }}
              onClickDelete={(e) => {
                handleItemDelete(e, dataItem, rowIndex);
              }}
            />
          );
        },
      },
    },
  ].filter(Boolean);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
      ref={datatableRef}>
      <Datatable
        verticalKeyWidth={100}
        locale={locale}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {t('securityRule.title')} <Typography variant="body2">{t('securityRule.sortByDescription')}</Typography>
          </Box>
        }
        data={securityRuleData}
        columns={columns}
        customButtons={customButtons}
        options={tableOptions}
        loading={securityRuleState.loading}
      />
      <BlockletSecurityItemDialog ref={securityItemDialogRef} />
      {confirmHolder}
    </Box>
  );
}
