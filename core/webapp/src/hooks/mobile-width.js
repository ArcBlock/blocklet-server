import { useTheme, useMediaQuery } from '@mui/material';

function useMobileWidth() {
  const theme = useTheme();
  const isBreakpointsDownSm = useMediaQuery(theme.breakpoints.down('md'));
  const minWidth = isBreakpointsDownSm ? 300 : theme.breakpoints.values.sm;
  return { minWidth, isMobile: isBreakpointsDownSm };
}

export default useMobileWidth;
