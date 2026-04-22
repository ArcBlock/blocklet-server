/**
 * FeedType 为 table 时，展示 table 数据
 */
import { Box, Card, Tooltip } from '@mui/material';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Img from '@arcblock/ux/lib/Img';
import { getProxyImageUrl } from '../utils';

function TablePreviewPage({ data, ...rest }) {
  const { items } = data;
  return (
    <Div {...rest}>
      {items.map((x) => (
        <Card variant="outlined" key={x.title} sx={{ p: 2, borderRadius: '8px', minWidth: 128 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}>
            {x.icon ? (
              <Img src={x.icon} alt={x.title} style={{ width: 16, height: 16 }} fallback={getProxyImageUrl(x.icon)} />
            ) : null}
            <Box
              className="metric-name"
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}>
              {x.title}
              {x.subtitle ? (
                <Tooltip title={x.subtitle} arrow placement="top">
                  <InfoOutlinedIcon fontSize="small" sx={{ fontSize: 14, ml: 0.5 }} />
                </Tooltip>
              ) : null}
            </Box>
          </Box>
          <Box className="metric-number" sx={{ color: x.content_color || 'rgba(3, 7, 18, 1)' }}>
            {x.content}
            {x.sub_content ? (
              <span className="sub-content" style={{ color: x.sub_content_color || 'rgba(156, 163, 175, 1)' }}>
                ({x.sub_content})
              </span>
            ) : null}
          </Box>
        </Card>
      ))}
    </Div>
  );
}

const Div = styled(Box)`
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  .metric-number {
    font-size: 18px;
    font-weight: 600;
    .sub-content {
      font-size: 12px;
      font-weight: 400;
      margin-left: 4px;
    }
  }
  .metric-name {
    font-size: 14px;
    color: rgba(156, 163, 175, 1);
  }
`;

TablePreviewPage.propTypes = {
  data: PropTypes.object.isRequired,
};

export default TablePreviewPage;
