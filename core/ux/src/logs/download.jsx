import { useState } from 'react';
import PropTypes from 'prop-types';
import dayjs from '@abtnode/util/lib/dayjs';

import Box from '@mui/material/Box';
import DownloadIcon from '@mui/icons-material/Download';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Spinner from '@mui/material/CircularProgress';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Dialog from '@arcblock/ux/lib/Dialog';
import formatName from '@abtnode/util/lib/format-name';

import Toast from '@arcblock/ux/lib/Toast';
import { useNodeContext } from '../contexts/node';

const DAYS = [1, 7];

export default function DownloadLog({ id, name = '' }) {
  const { t } = useLocaleContext();
  const { restApi, inService } = useNodeContext();
  const [showDialog, setShowDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [days, setDays] = useState(1);

  const onDownload = async () => {
    if (isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);
      const logId = inService ? '' : `/${id}`;
      const res = await restApi.get(`/download/log${logId}?days=${days}`, {
        responseType: 'blob',
        timeout: 30 * 60 * 1000,
      });

      const href = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', `${formatName(name || id)}.${dayjs().format('YYYYMMDDHHmmss')}.log.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);

      setIsDownloading(false);
      setShowDialog(false);
    } catch (error) {
      setIsDownloading(false);
      Toast.error(error.message);
    }
  };

  const onDaysChange = (e) => {
    setDays(e.target.value);
  };

  return [
    <Box
      style={{ gap: 16 }}
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}>
      <Button data-cy="download-logs" variant="outlined" onClick={() => setShowDialog(true)} disabled={isDownloading}>
        {isDownloading ? (
          <Spinner size={16} />
        ) : (
          <DownloadIcon fontSize="small" style={{ transform: 'translateY(2px)' }} />
        )}
        <Box
          sx={{
            ml: 0.5,
          }}>
          {t('common.download')}
        </Box>
      </Button>
    </Box>,
    showDialog && (
      <Dialog
        open
        onClose={() => {
          setShowDialog(false);
        }}
        disableEscapeKeyDown
        title={t('common.download')}
        PaperProps={{ style: { minHeight: 'auto' } }}
        actions={
          <Button data-cy="download-logs" variant="outlined" onClick={() => onDownload()} disabled={isDownloading}>
            {isDownloading && <Spinner size={16} />}
            <Box
              sx={{
                ml: 0.5,
              }}>
              {t('common.confirm')}
            </Box>
          </Button>
        }>
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            justifyContent: 'center',
          }}>
          <FormControl size="small" fullWidth>
            <Select value={days} onChange={onDaysChange}>
              {DAYS.map((x) => (
                <MenuItem key={x} value={x}>
                  {t(`log.lastDays.${x}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Dialog>
    ),
  ];
}

DownloadLog.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
};
