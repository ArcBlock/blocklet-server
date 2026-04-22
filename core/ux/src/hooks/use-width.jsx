import { useTheme, useMediaQuery } from '@mui/material';

function useWidth() {
  const theme = useTheme();
  const keys = [...theme.breakpoints.keys].reverse();
  return (
    keys.reduce((output, key) => {
      // eslint-disable-next-line
      const matches = useMediaQuery(theme.breakpoints.up(key));
      return !output && matches ? key : output;
    }, null) || 'xs'
  );
}

export default useWidth;
