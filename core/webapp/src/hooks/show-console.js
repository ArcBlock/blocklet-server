import useMediaQuery from '@mui/material/useMediaQuery';

export default function useShowConsole() {
  const isBreakpointsUpSm = useMediaQuery(theme => theme.breakpoints.up('sm'));

  return isBreakpointsUpSm && process.env.NODE_ENV === 'development';
}
