import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';

function DangerItem({ title, description, children }) {
  return (
    <Div>
      <Typography component="div" className="danger-item-info">
        <Typography className="title" component="h3" variant="h6" color="textPrimary" gutterBottom>
          {title}
        </Typography>
        <Typography className="desc" component="p" variant="body1" color="textSecondary">
          {description}
        </Typography>
      </Typography>
      <Typography component="div" className="danger-item-action">
        {children}
      </Typography>
    </Div>
  );
}

DangerItem.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

const Div = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .danger-item-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    .title {
      word-break: break-word;
    }
    .desc {
      word-break: break-word;
    }
  }

  .danger-item-action {
    width: 160px;
    flex-shrink: 0;
    text-align: right;
    cursor: pointer;
    @media (max-width: ${props => props.theme.breakpoints.values.sm}px) {
      width: auto;
      margin-left: 10px;
    }
  }
`;

function DangerZone({ children, ...rest }) {
  return <Container {...rest}>{children}</Container>;
}

const Container = styled.div`
  border: 1px solid ${({ theme }) => theme.palette.divider};
  padding: 16px;
`;

DangerZone.propTypes = { children: PropTypes.node.isRequired };

export { DangerZone, DangerItem };
