import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import TablePreviewPage from './table';
import GraphicPreviewPage from './graphic';

function DataPreviewPage({ data, feedType = 'data-tracker', ...rest }) {
  return (
    <Container {...rest}>
      {feedType === 'data-tracker' && data.type === 'table' && <TablePreviewPage data={data} />}
      {(feedType === 'graphic' || feedType === 'gallery') && <GraphicPreviewPage data={data} />}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 4px;
  &:last-child {
    margin-bottom: 0;
  }
`;

DataPreviewPage.propTypes = {
  data: PropTypes.object.isRequired,
  feedType: PropTypes.string,
};

export default DataPreviewPage;
