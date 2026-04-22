import styled from '@emotion/styled';
import PropTypes from 'prop-types';

export default function WaiterContainer({ children }) {
  return <Container>{children}</Container>;
}

WaiterContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

const Container = styled.div`
  color: #1dc1c7;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
`;
