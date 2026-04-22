import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';

import { alpha } from '@mui/material/styles';

export const CardWrapper = styled.div`
  min-height: ${({ minHeight }) => (minHeight === 'none' ? 'auto' : `${minHeight || 160}px`)};
  height: ${({ height, minHeight }) => (height === 'none' ? 'auto' : `${height || minHeight || 160}px`)};
  padding: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  border: 1px solid;
  border-color: ${({ theme }) => theme.palette.divider};
  background-color: ${({ theme }) => theme.palette.background.paper};
  box-shadow: ${({ theme }) => theme.shadows[1]};
`;

export const commonProps = {
  loading: PropTypes.bool,
  authLoading: PropTypes.bool,
  disconnectLoading: PropTypes.bool,
  connecting: PropTypes.bool,
};

export const ButtonWrapper = styled(Button)`
  color: ${({ theme }) => theme.palette.text.primary};
  font-weight: 500;
  border-color: ${({ theme }) => theme.palette.grey[300]};
  line-height: 1.5;
  &:hover {
    background-color: ${({ theme }) => alpha(theme.palette.primary.main, 0.1)};
  }
`;
