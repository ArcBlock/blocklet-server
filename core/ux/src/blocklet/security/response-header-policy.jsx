import { useRef } from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import { useMemoizedFn, useRequest } from 'ahooks';
import Datatable from '@arcblock/ux/lib/Datatable';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useConfirm } from '@arcblock/ux/lib/Dialog';
import { Icon } from '@iconify/react';
import iconDeleteRounded from '@iconify-icons/material-symbols/delete-rounded';
import iconEditRounded from '@iconify-icons/material-symbols/edit-rounded';
import iconPreview from '@iconify-icons/material-symbols/preview';
import iconLockOutline from '@iconify-icons/material-symbols/lock-outline';
import Toast from '@arcblock/ux/lib/Toast';
import omit from 'lodash/omit';
import sortBy from 'lodash/sortBy';

import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';
import BlockletResponseHeaderPolicyItemDialog from './response-header-policy-item-dialog';
import { formatResponseHeaderPolicy } from './utils';
import { echoError } from './dom-utils';

export default function BlockletResponseHeaderPolicy() {
  const { t, locale } = useLocaleContext();
  const { blocklet } = useBlockletContext();
  const { api } = useNodeContext();
  const did = blocklet?.meta?.did;

  const dialogRef = useRef(null);
  const datatableRef = useRef(null);
  const { confirmApi, confirmHolder } = useConfirm();

  const onTableChange = () => {};
  const dataState = useRequest(async () => {
    const { responseHeaderPolicies } = await api.getBlockletResponseHeaderPolicies({ input: { did } });
    return sortBy(
      responseHeaderPolicies.map((item) => formatResponseHeaderPolicy(item)),
      (x) => (x.isProtected ? 1 : 0)
    );
  });

  const dataList = dataState.data || [];

  const handleItemAdd = useMemoizedFn(() => {
    dialogRef.current.open(async (data, { close, done }) => {
      await echoError(async () => {
        await api.addBlockletResponseHeaderPolicy({
          input: {
            did,
            data,
          },
        });
        Toast.success(t('common.succeeded'));
        dataState.run();
        close();
      });
      done();
    });
  });
  const handleItemView = useMemoizedFn((dataItem) => {
    dialogRef.current.open(
      (_, { close, done }) => {
        done();
        close();
      },
      omit(dataItem, ['id'])
    );
  });
  const handleItemEdit = useMemoizedFn((dataItem) => {
    dialogRef.current.open(async (data, { close, done }) => {
      await echoError(async () => {
        await api.updateBlockletResponseHeaderPolicy({
          input: { did, data: { ...data, id: dataItem.id } },
        });
        Toast.success(t('common.succeeded'));
        dataState.run();
        close();
      });
      done();
    }, dataItem);
  });
  const handleItemDelete = useMemoizedFn((dataItem) => {
    confirmApi.open({
      title: t('responseHeaderPolicy.delete.title'),
      content: t('responseHeaderPolicy.delete.description'),
      confirmButtonText: t('common.confirm'),
      confirmButtonProps: {
        color: 'error',
      },
      cancelButtonText: t('common.cancel'),
      onConfirm(close) {
        echoError(async () => {
          await api.deleteBlockletResponseHeaderPolicy({
            input: { did, id: dataItem.id },
          });
          Toast.success(t('common.succeeded'));
          dataState.run();
          close();
        });
      },
    });
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
        const dataItem = dataList[dataIndex];
        handleItemView(dataItem);
      }
    },
  };

  const customButtons = [
    <Button
      key="refresh"
      size="small"
      variant="outlined"
      onClick={() => {
        dataState.run();
      }}
      sx={{
        mr: 1,
      }}>
      {t('common.refresh')}
    </Button>,
    <Button key="add" size="small" variant="contained" onClick={handleItemAdd}>
      {t('common.add')}
    </Button>,
  ];

  const columns = [
    {
      label: t('common.name'),
      name: 'name',
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite(rowIndex) {
          const dataItem = dataList[rowIndex];
          const protectedEle = dataItem.isProtected ? (
            <Tooltip title="Built-in policy, can't edit">
              <Box
                component={Icon}
                icon={iconLockOutline}
                sx={{
                  fontSize: 16,
                }}
              />
            </Tooltip>
          ) : null;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {protectedEle} {dataItem.name}
            </Box>
          );
        },
      },
    },
    {
      label: t('common.description'),
      name: 'description',
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
          const dataItem = dataList[rowIndex];
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }} onClick={(e) => e.stopPropagation()}>
              {dataItem.isProtected ? (
                <Tooltip title={t('common.view')}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      handleItemView(dataItem, rowIndex);
                    }}>
                    <Icon icon={iconPreview} fontSize={18} />
                  </IconButton>
                </Tooltip>
              ) : null}
              {dataItem.isProtected ? null : (
                <Tooltip title={t('common.edit')}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      handleItemEdit(dataItem, rowIndex);
                    }}
                    color="success">
                    <Icon icon={iconEditRounded} fontSize={18} />
                  </IconButton>
                </Tooltip>
              )}
              {dataItem.isProtected ? null : (
                <Tooltip title={t('common.delete')}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      handleItemDelete(dataItem, rowIndex);
                    }}
                    color="error">
                    <Icon icon={iconDeleteRounded} fontSize={18} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
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
        title={t('responseHeaderPolicy.title')}
        data={dataList}
        columns={columns}
        customButtons={customButtons}
        options={tableOptions}
        loading={dataState.loading}
        onChange={onTableChange}
      />
      <BlockletResponseHeaderPolicyItemDialog ref={dialogRef} />
      {confirmHolder}
    </Box>
  );
}
