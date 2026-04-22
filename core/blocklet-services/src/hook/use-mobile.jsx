import { useTheme, useMediaQuery } from '@mui/material';

/**
 * @description
 * @export
 * @param {{ key: string | import('@mui/material').Breakpoint }} [{ key }={ key: 'md' }]
 * @return {*}
 */
export default function useMobile({ key } = { key: 'sm' }) {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down(key));
}
