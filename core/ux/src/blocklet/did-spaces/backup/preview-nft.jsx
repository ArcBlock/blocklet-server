import { useState } from 'react';
import { string } from 'prop-types';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { DIDSpaceDefaultNFT } from '@blocklet/did-space-react';

function PreviewSpaceNft({ src, width = '58px', height = '58px' }) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <div style={{ position: 'relative' }} onClick={handleOpen}>
        <object data={src} width={width} height={height}>
          <DIDSpaceDefaultNFT style={{ cursor: 'pointer', width: '64px', height: '64px' }} />
        </object>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: '1',
            cursor: 'pointer',
          }}
          onClick={handleOpen}
        />
      </div>
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
          (
          <object
            data={src}
            style={{
              width: '100%',
              height: '75vh',
              objectFit: 'contain',
            }}>
            <DIDSpaceDefaultNFT
              style={{
                width: '100%',
                height: '75vh',
              }}
            />
          </object>
          )
        </DialogContent>
      </Dialog>
    </>
  );
}

PreviewSpaceNft.propTypes = {
  src: string.isRequired,
  width: string,
  height: string,
};

export default PreviewSpaceNft;
