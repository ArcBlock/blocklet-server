import PropTypes from 'prop-types';
import { Box, useTheme, styled } from '@mui/material';

import { useNodeContext } from '../../contexts/node';

const Wrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  color: #999;
  .empty-icon {
    margin: 10px 0;
  }
`;

/**
 * Empty component to display empty state
 * @typedef {{
 *   color?: string;
 *   size?: number;
 *   children?: import('react').ReactNode;
 * } & import('react').ComponentPropsWithoutRef<"div"> } EmptyProps
 */

/**
 * Empty state component
 * @param {EmptyProps} props
 * @returns {JSX.Element}
 */
function Empty({ children = null, ...rest }) {
  const node = useNodeContext();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Wrapper {...rest}>
      <img
        src={`${node.imgPrefix}/${isDark ? 'all-done-dark' : 'all-done-light'}.svg`}
        alt="All Done"
        width={120}
        height={120}
        style={{ maxHeight: '100%', maxWidth: '100%' }}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
      <Box className="empty-content">{children}</Box>
    </Wrapper>
  );
}

Empty.propTypes = {
  color: PropTypes.string,
  children: PropTypes.any,
};

export default Empty;
