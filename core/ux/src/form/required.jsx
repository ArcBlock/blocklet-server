import styled from '@emotion/styled';

const Required = styled.span`
  color: ${(props) => props.theme.palette.error.main};
  &::before {
    content: '*';
  }
`;

export default Required;
