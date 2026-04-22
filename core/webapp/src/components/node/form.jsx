import PropTypes from 'prop-types';
import styled from '@emotion/styled';

export default function Form({ children, ...props }) {
  return (
    <Container>
      <form {...props}>{children}</form>
    </Container>
  );
}

Form.propTypes = {
  children: PropTypes.any.isRequired,
};

const Container = styled.div`
  width: 100%;

  form {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;

    .form-submit {
      margin-top: 32px;
      margin-right: 32px;
      width: 180px;
    }

    .form-actions {
      display: flex;
      @media (max-width: ${props => props.theme.breakpoints.values.sm}px) {
        flex-direction: column;
        width: 100%;
        button {
          width: 100%;
          margin-right: 0;
        }
      }
    }

    .form-item {
      margin-top: 16px;
      margin-right: 0;
    }
  }
`;
