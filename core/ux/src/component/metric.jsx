/* eslint-disable react/no-danger */
import React, { isValidElement } from 'react';
import { Box, Link, Card, CardContent } from '@mui/material';
import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import styled from '@emotion/styled';
import Skeleton from '@mui/material/Skeleton';

export default function Metric({
  icon = undefined,
  value,
  name,
  url = '',
  animated = false,
  LinkComponent = Link,
  loading = false,
}) {
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    return <Box component={Icon} icon={icon} alt={typeof name === 'string' ? name : ''} sx={{ fontSize: 30 }} />;
  };

  const metricContent = (
    <CardContent className="metric__content">
      {icon && <Box className="metric__icon">{renderIcon()}</Box>}
      <Box className="metric__title">{name}</Box>
      <Box className="metric__value">
        {isValidElement(value) ? (
          <Box className={`metric__number ${animated ? 'metric__number--animated' : ''}`}>{value}</Box>
        ) : (
          <Box
            className={`metric__number ${animated ? 'metric__number--animated' : ''}`}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        )}
      </Box>
    </CardContent>
  );

  if (loading) {
    return (
      <StyledCard variant="outlined">
        <CardContent className="metric__content">
          {icon && (
            <Box className="metric__icon">
              <Skeleton variant="circular" width={40} height={40} />
            </Box>
          )}
          <Skeleton className="metric__title" variant="rounded" width={120} height={20} sx={{ mb: 1 }} />
          <Skeleton
            className={`metric__number ${animated ? 'metric__number--animated' : ''}`}
            variant="rounded"
            width={100}
            height="32px"
          />
        </CardContent>
      </StyledCard>
    );
  }

  return (
    <StyledCard variant="outlined">
      {url ? (
        <LinkComponent href={url} sx={{ textDecoration: 'none', color: 'inherit' }}>
          {metricContent}
        </LinkComponent>
      ) : (
        metricContent
      )}
    </StyledCard>
  );
}

Metric.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  name: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  url: PropTypes.string,
  animated: PropTypes.bool,
  LinkComponent: PropTypes.elementType,
  loading: PropTypes.bool,
};

const StyledCard = styled(Card)`
  height: 100%;
  transition:
    box-shadow 0.2s ease-in-out,
    transform 0.2s ease-in-out;

  &:hover {
    box-shadow: ${(props) => props.theme.shadows[4]};
  }

  .metric__content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 20px;
    height: 100%;

    @media (max-width: ${(props) => props.theme.breakpoints.values.sm}px) {
      padding: 16px;
      gap: 8px;
    }
  }

  .metric__icon {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 4px;
    width: 100%;

    /* Preserve original icon styles, only ensure minimum size */
    > * {
      min-width: 32px;
      min-height: 32px;

      @media (max-width: ${(props) => props.theme.breakpoints.values.sm}px) {
        min-width: 24px;
        min-height: 24px;
      }
    }
  }

  .metric__title {
    font-size: 14px;
    font-weight: 500;
    color: ${(props) => props.theme.palette.text.secondary};
    text-transform: capitalize;
    line-height: 1.4;
    width: 100%;

    @media (max-width: ${(props) => props.theme.breakpoints.values.sm}px) {
      font-size: 12px;
    }
  }

  .metric__value {
    width: 100%;
    margin-top: auto;
  }

  .metric__number {
    font-size: ${(props) => (props.size === 'small' ? 28 : 32)}px;
    font-weight: 600;
    line-height: 1.2;
    color: ${(props) => props.theme.typography.color.main};

    small {
      font-size: 14px;
      line-height: 1.2;
      font-weight: 400;
      color: ${(props) => props.theme.palette.text.secondary};
      margin-left: 4px;
    }

    @media (max-width: ${(props) => props.theme.breakpoints.values.sm}px) {
      font-size: ${(props) => (props.size === 'small' ? 20 : 24)}px;

      small {
        font-size: 12px;
      }
    }
  }

  .metric__number--animated {
    animation-name: blink-opacity;
    animation-duration: 250ms;
    animation-timing-function: linear;
    animation-iteration-count: 1;
    background-color: transparent !important;
  }

  @keyframes blink-opacity {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      opacity: 1;
    }
  }
`;
