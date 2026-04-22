import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Typography,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import VideoEmbed, { isVideoUrl } from './video-embed';

function VideoDialog({ setParams, onClose, params }) {
  const { t } = useLocaleContext();
  const [inputUrl, setInputUrl] = useState('');
  const isDuplicated = inputUrl && params.blockletVideos.includes(inputUrl);
  const verifyUrl = isVideoUrl(inputUrl);

  const handleSave = () => {
    setParams((item) => {
      const arr = [...item.blockletVideos];
      arr.push(inputUrl);
      return {
        ...item,
        blockletVideos: arr,
      };
    });
    onClose();
  };

  return (
    <Dialog open fullWidth maxWidth="sm">
      <DialogTitle>{t('studio.videoDialogTitle')}</DialogTitle>
      <DialogContent>
        <OutlinedInput
          fullWidth
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder={t('studio.videoInputLabel')}
          endAdornment={
            inputUrl ? (
              <InputAdornment position="end">
                <IconButton onClick={() => setInputUrl('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : null
          }
          error={isDuplicated}
        />
        {isDuplicated && (
          <Typography variant="body2" color="error">
            {t('studio.duplicateVideo')}
          </Typography>
        )}
        <VideoEmbed url={inputUrl} style={{ marginTop: '20px', borderRadius: '4px' }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>{t('studio.cancel')}</Button>
        <Button disabled={!verifyUrl || isDuplicated} onClick={handleSave}>
          {t('studio.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

VideoDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  setParams: PropTypes.func.isRequired,
};

export default VideoDialog;
