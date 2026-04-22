import { useState } from 'react';
import PropTypes from 'prop-types';
import ReactPlaceholder from 'react-placeholder';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import { CloseOutlined as CloseOutlinedIcon } from '@mui/icons-material';
// eslint-disable-next-line import/no-unresolved
import EmptySpacesNFT from './icons/empty-spaces-nft.svg?react';

function PreviewSpaceNft({ src, alt }) {
  const [showEmptySpaceNFT, setShowEmptySpaceNFT] = useState(false);
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <ReactPlaceholder
        ready={showEmptySpaceNFT}
        customPlaceholder={
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <img
            style={{ cursor: 'pointer' }}
            alt={alt}
            src={src}
            width="58px"
            height="58px"
            onError={() => setShowEmptySpaceNFT(true)}
            onClick={handleOpen}
          />
        }>
        <EmptySpacesNFT style={{ cursor: 'pointer', width: '58px', height: '58px' }} onClick={handleOpen} />
      </ReactPlaceholder>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="preview-space-nft-display"
        aria-describedby="preview space nft display"
        fullWidth
        maxWidth="md">
        <DialogContent style={{ padding: '8px 8px', backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <IconButton
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            style={{ position: 'absolute', top: 8, right: 8, color: 'white' }}>
            <CloseOutlinedIcon />
          </IconButton>
          {showEmptySpaceNFT ? (
            <EmptySpacesNFT
              style={{
                width: '100%',
                height: '75vh',
              }}
            />
          ) : (
            <img
              src={src}
              alt=""
              style={{
                width: '100%',
                height: '75vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

PreviewSpaceNft.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
};

export default PreviewSpaceNft;
