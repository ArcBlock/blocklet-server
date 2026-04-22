import React, { Suspense, isValidElement } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Center from '@arcblock/ux/lib/Center';
import CircularProgress from '@mui/material/CircularProgress';
import { useBlockletContext } from '@abtnode/ux/lib/contexts/blocklet';

export default function AppContent({ component = undefined }) {
  const { blocklet } = useBlockletContext();

  if (!component) {
    return null;
  }

  return (
    <Box className="page-content">
      <Suspense
        fallback={
          <Center relative="parent">
            <CircularProgress />
          </Center>
        }>
        {isValidElement(component) ? component : React.createElement(component, { blocklet })}
      </Suspense>
    </Box>
  );
}

AppContent.propTypes = {
  component: PropTypes.any,
};
