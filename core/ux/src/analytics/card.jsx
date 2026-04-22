import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function InsightCard({
  style = {},
  title = null,
  value = null,
  graph = null,
  description = null,
  empty = null,
}) {
  return (
    <StyledCard>
      <CardContent style={{ ...style }}>
        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: 14,
          }}>
          {title}
        </Typography>
        {empty && React.isValidElement(empty) ? (
          <Box
            style={{ height: 150 }}
            sx={{
              color: 'text.secondary',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            {empty}
          </Box>
        ) : (
          <>
            <Typography
              variant="h5"
              component="div"
              sx={{
                mt: 1,
              }}>
              {value}
            </Typography>
            {graph}
            {!!description && (
              <Box
                sx={{
                  display: 'flex',
                  color: 'text.secondary',
                  fontSize: 12,
                  marginTop: 3,
                }}>
                {description}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </StyledCard>
  );
}

InsightCard.propTypes = {
  style: PropTypes.object,
  title: PropTypes.node,
  value: PropTypes.node,
  graph: PropTypes.node,
  description: PropTypes.any,
  empty: PropTypes.node,
};

const StyledCard = styled(Card)`
  .card-content {
    height: 150px;
  }

  .card-sparkline {
    flex: 2;
    display: flex;
    position: relative;
    *[hidden] {
      display: none;
    }
  }
  .sparkline {
    stroke: ${(props) => props.theme.palette.primary.main};
    fill: ${(props) => props.theme.palette.primary.main}1A;
  }
  .tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 2px 5px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 9999;
  }
  .sparkline--cursor {
    stroke: orange;
  }

  .sparkline--spot {
    fill: red;
    stroke: red;
  }
`;
