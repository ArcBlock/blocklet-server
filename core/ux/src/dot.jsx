import styled from '@emotion/styled';

const color = {
  success: '#3ab39d',
  error: '#D0021B',
};

const defaultSize = '10px';

const Dot = styled.div`
  display: inline-block;
  min-width: ${(props) => props.size || defaultSize};
  min-height: ${(props) => props.size || defaultSize};
  background-color: ${(props) => color[props.color] || props.color || color.success};
  border-radius: 100%;
`;

export default Dot;
