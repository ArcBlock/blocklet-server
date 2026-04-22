import styled from '@emotion/styled';
import PropTypes from 'prop-types';

export default function ContentLayout({ children, ...props }) {
  return <Container {...props}>{children}</Container>;
}

ContentLayout.propTypes = {
  children: PropTypes.any.isRequired,
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;

  .header {
    text-align: center;
  }

  .body {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 30px;
    width: 100%;
    min-height: 200px;
    flex: 1;

    ${(props) => props.theme.breakpoints.up('md')} {
      padding: 24px;
    }

    ${(props) => props.theme.breakpoints.down('md')} {
      padding: 0 16px 16px;
    }
  }

  .footer {
    display: flex;
    justify-content: center;

    ${(props) => props.theme.breakpoints.up('sm')} {
      padding-bottom: 34px;
    }

    ${(props) => props.theme.breakpoints.down('md')} {
      margin-top: auto;
      padding-bottom: 10px;
    }
  }
`;
