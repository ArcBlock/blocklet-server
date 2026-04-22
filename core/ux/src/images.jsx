import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import LazyImg from './lazy-img';

export default function Images({ data = [], lazy = false, ...props }) {
  if (!data || !data.length) {
    return null;
  }

  return (
    <StyledBox {...props}>
      {data.map((item) => (
        <a key={item.url} href={item.url} target="_blank" rel="noreferrer">
          {lazy ? <LazyImg src={item.url} alt={item.alt || ''} /> : <img src={item.url} alt={item.alt || ''} />}
        </a>
      ))}
    </StyledBox>
  );
}

Images.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string,
      alt: PropTypes.string,
    })
  ),
  lazy: PropTypes.bool,
};

const StyledBox = styled(Box)`
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-bottom: -12px;
  a {
    display: flex;
  }
  img {
    height: 128px;
    cursor: pointer;
    margin-right: 12px;
    margin-bottom: 12px;
  }
`;
