/**
 * FeedType 为 graphic | gallery 时
 */
import PropTypes from 'prop-types';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import Img from '@arcblock/ux/lib/Img';
import { getProxyImageUrl } from '../utils';

function GraphicPreviewPage({ data }) {
  const { items } = data;
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const isLg = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const cols = () => {
    if (isSm) return 1;
    if (isMd) return 3;
    if (isLg) return 4;
    return 6;
  };
  return (
    <ImageList variant="quilted" cols={cols()} gap={8} rowHeight={128} sx={{ margin: 0 }}>
      {items.map((x) => {
        const img = x.cover || x.display;
        if (img) {
          return (
            <a key={img} href={x.link} target="_blank" rel="noopener noreferrer">
              <ImageListItem>
                <Img src={img} alt={x.title || ''} style={{ borderRadius: '8px' }} fallback={getProxyImageUrl(img)} />
              </ImageListItem>
            </a>
          );
        }
        return null;
      })}
    </ImageList>
  );
}

GraphicPreviewPage.propTypes = {
  data: PropTypes.object.isRequired,
};

export default GraphicPreviewPage;
