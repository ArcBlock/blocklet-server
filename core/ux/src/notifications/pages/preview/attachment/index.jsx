import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { useContext } from 'react';
import { Divider, useTheme, useMediaQuery } from '@mui/material';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import LinkPreviewPage from './link';
import ImagePreviewPage from './image';
import TextPreviewPage from './text';
import TokenPreview from './token';
import AssetPreview from './asset';
import DAPPPreview from './dapp';
import TransactionPreview from './transaction';

function AttachmentPreviewPage({ attachment, ...rest }) {
  const { local } = useContext(LocaleContext);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const theme = useTheme();

  return (
    <Container {...rest} isMd={isMd}>
      {attachment.type === 'link' && <LinkPreviewPage attachment={attachment} {...rest} isMd={isMd} />}
      {attachment.type === 'image' && <ImagePreviewPage attachment={attachment} isMd={isMd} />}
      {attachment.type === 'text' && <TextPreviewPage attachment={attachment} isMd={isMd} />}
      {attachment.type === 'token' && <TokenPreview data={attachment.data} local={local} isMd={isMd} />}
      {attachment.type === 'asset' || attachment.type === 'vc' ? (
        <AssetPreview data={attachment.data} local={local} isMd={isMd} type={attachment.type} />
      ) : null}
      {attachment.type === 'dapp' && <DAPPPreview data={attachment.data} local={local} isMd={isMd} />}
      {attachment.type === 'transaction' && (
        <TransactionPreview data={attachment.data} local={local} {...rest} isMd={isMd} />
      )}
      {attachment.type === 'divider' && <Divider sx={{ mb: 1, mt: 1 }} style={{ color: theme.palette.divider }} />}
    </Container>
  );
}

const Container = styled.div`
  display: ${({ sx = {} }) => sx.display || 'flex'};
  flex-direction: ${({ sx = {} }) => sx.flexDirection || 'column'};
  gap: ${({ sx = {} }) => sx.gap || 1};
  width: ${({ isMd = false }) => (isMd ? '100%' : 'auto')};
  &:last-child {
    margin-bottom: 0;
  }
`;

AttachmentPreviewPage.propTypes = {
  attachment: PropTypes.object.isRequired,
};

export default AttachmentPreviewPage;
