/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable no-console */
import Tag from '@arcblock/ux/lib/Tag';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, CircularProgress, Icon, Link, styled, Tooltip, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import isEmpty from 'lodash/isEmpty';
import dayjs from '@abtnode/util/lib/dayjs';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { BACKUPS } from '@abtnode/constant';
import Datatable from '@arcblock/ux/lib/Datatable';
import xbytes from 'xbytes';
import InfoIcon from '@mui/icons-material/Info';
import PropTypes from 'prop-types';
import { getDIDSpaceDidFromEndpoint } from '../../../util/spaces';
import { useBlockletStorageContext } from '../../../contexts/blocklet-storage';

// 自定义无背景 Tooltip
const CustomTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(
  () => ({
    '.MuiTooltip-tooltip': {
      backgroundColor: 'transparent',
      padding: 0,
      margin: 0,
      boxShadow: 'none',
      maxWidth: 'none',
    },
    '.MuiTooltip-arrow': {
      color: 'rgba(230, 235, 245, 1)',
    },
  })
);

// 状态标签组件
function StatusTag({ status, message = '', createdAt }) {
  const { t } = useLocaleContext();
  const timeoutError = status === BACKUPS.STATUS.PROGRESS && dayjs().diff(createdAt, 'hours') >= BACKUPS.TIMEOUT_HOURS;
  const timeoutErrorMessage = timeoutError && t('common.timeoutError');
  const pending = status === BACKUPS.STATUS.PROGRESS && !timeoutError;
  const success = status === BACKUPS.STATUS.SUCCEEDED && !timeoutError;

  if (pending) {
    return (
      <Typography
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: '14px',
        }}>
        <CircularProgress sx={{ marginRight: '4px' }} size="12px" />
        {t('common.progress')}
      </Typography>
    );
  }

  if (success) {
    return <Tag type="success">{t('common.succeeded')}</Tag>;
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
      }}>
      <Tag type="error">{t('common.failed')}</Tag>
      <Tooltip style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} title={message || timeoutErrorMessage}>
        <Icon>
          <HelpOutlineIcon style={{ width: '24px', height: '24px' }} color="error" />
        </Icon>
      </Tooltip>
    </Box>
  );
}

StatusTag.propTypes = {
  status: PropTypes.string.isRequired,
  message: PropTypes.string,
  createdAt: PropTypes.string.isRequired,
};

// 成功状态带详情的标签组件
function SuccessStatusWithDetails({ metadata = {} }) {
  const { t } = useLocaleContext();

  if (isEmpty(metadata)) {
    return <Tag type="success">{t('common.succeeded')}</Tag>;
  }

  const fileCount = metadata.count || 0;
  const fileSize = metadata.size || 0;
  const formattedSize = xbytes(fileSize, { iec: true });

  const tooltipContent = (
    <Box
      sx={{
        p: 1,
        borderRadius: 1,
        boxShadow: 2,
        color: 'black',
        backgroundColor: 'white',
      }}>
      <Typography variant="body2">
        {t('common.fileCount')}: {fileCount}
      </Typography>
      <Typography variant="body2">
        {t('common.fileSize')}: {formattedSize}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
      }}>
      <Tag type="success">{t('common.succeeded')}</Tag>
      <CustomTooltip
        title={tooltipContent}
        style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
        placement="left">
        <Icon>
          <InfoIcon style={{ width: '24px', height: '24px' }} color="primary" />
        </Icon>
      </CustomTooltip>
    </Box>
  );
}

SuccessStatusWithDetails.propTypes = {
  metadata: PropTypes.object,
};

function SpacesBackupRecordsTable() {
  const { t, locale } = useLocaleContext();
  const { spaceGateways, backups, backupsLoading } = useBlockletStorageContext();

  // 表格列定义
  const columns = useMemo(
    () => [
      {
        label: 'DID Space',
        name: 'target',
        options: {
          customBodyRenderLite: (index) => {
            const { targetUrl, targetName, status, createdAt } = backups[index];
            const timeoutError =
              status === BACKUPS.STATUS.PROGRESS && dayjs().diff(createdAt, 'hours') >= BACKUPS.TIMEOUT_HOURS;
            const success = status === BACKUPS.STATUS.SUCCEEDED && !timeoutError;

            const spaceName =
              targetName ||
              spaceGateways.find((spaceGateway) =>
                targetUrl?.includes(getDIDSpaceDidFromEndpoint(spaceGateway?.endpoint))
              )?.name ||
              'Unknown DID Space';

            if (!success) {
              return (
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '16px',
                  }}>
                  {spaceName}
                </Typography>
              );
            }

            return (
              <Link
                href={targetUrl}
                target="_blank"
                sx={{
                  fontSize: '16px',
                }}>
                {spaceName}
              </Link>
            );
          },
        },
      },
      {
        label: t('common.strategy'),
        name: 'strategy',
        options: {
          customBodyRender: (strategy) => {
            const text = strategy === 0 ? t('common.auto') : t('common.manual');
            return <Tag>{text}</Tag>;
          },
        },
      },
      {
        label: t('common.startTime'),
        name: 'createdAt',
        options: {
          customBodyRender: (createdAt) => dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss'),
        },
      },
      {
        label: t('common.endTime'),
        name: 'updatedAt',
        options: {
          customBodyRender: (updatedAt) => (isEmpty(updatedAt) ? '' : dayjs(updatedAt).format('YYYY-MM-DD HH:mm:ss')),
        },
      },
      {
        label: t('common.status'),
        name: 'status',
        options: {
          customBodyRenderLite: (index) => {
            const record = backups?.[index] ?? {};
            const { status, message, createdAt, metadata } = record;

            const timeoutError =
              status === BACKUPS.STATUS.PROGRESS && dayjs().diff(createdAt, 'hours') >= BACKUPS.TIMEOUT_HOURS;
            const pending = status === BACKUPS.STATUS.PROGRESS && !timeoutError;
            const success = status === BACKUPS.STATUS.SUCCEEDED && !timeoutError;

            if (pending) {
              return (
                <Typography
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '14px',
                  }}>
                  <CircularProgress sx={{ marginRight: '4px' }} size="12px" />
                  {t('common.progress')}
                </Typography>
              );
            }

            if (success) {
              return <SuccessStatusWithDetails metadata={metadata} />;
            }

            return <StatusTag status={status} message={message} createdAt={createdAt} />;
          },
        },
      },
    ],
    [backups, spaceGateways, t]
  );

  const showEmptyState = useMemo(() => {
    return !backups?.length;
  }, [backups]);

  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {showEmptyState ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100px',
            color: '#9397A1',
            marginTop: '16px',
            marginBottom: '24px',
          }}>
          {t('storage.spaces.record.emptyData')}
        </Box>
      ) : (
        <Datatable
          title=""
          loading={backupsLoading}
          data={backups}
          columns={columns}
          emptyNode={t('storage.spaces.record.emptyData', locale)}
          options={{
            download: false,
            filter: false,
            print: false,
            search: false,
            viewColumns: false,
          }}
        />
      )}
    </>
  );
}

export default SpacesBackupRecordsTable;
