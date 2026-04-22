/* eslint-disable react/prop-types */
import Box from '@mui/material/Box';
import Fullpage from '@arcblock/did-connect-react/lib/Connect/fullpage';

export default function Wrapper({ children, ...props }) {
  return (
    <Fullpage {...props} did={window?.blocklet?.appPid || window?.env?.appPid}>
      <Box
        sx={{
          maxWidth: '100%',
          height: '100%',
        }}>
        {children}
      </Box>
    </Fullpage>
  );
}
