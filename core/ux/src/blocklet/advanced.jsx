import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import Box from '@mui/material/Box';
import { useNodeContext } from '../contexts/node';
import { isInstalling, BlockletAdminRoles } from '../util';
import { withPermission } from '../permission';
import DangerZone from './danger-zone';

function BlockletEnvironment({ blocklet, onUpdate = () => {}, hasPermission = false }) {
  if (isInstalling(blocklet.status)) {
    return null;
  }

  return (
    <Div>
      <DangerZone blocklet={blocklet} onUpdate={onUpdate} hasPermission={hasPermission} />
    </Div>
  );
}

const BlockletEnvironmentInDaemon = withPermission(BlockletEnvironment, 'mutate_blocklets');
const BlockletEnvironmentInService = withPermission(BlockletEnvironment, '', BlockletAdminRoles);

export default function BlockletEnvironmentWithPermission(props) {
  const { inService } = useNodeContext();
  if (inService) {
    return <BlockletEnvironmentInService {...props} />;
  }

  return <BlockletEnvironmentInDaemon {...props} />;
}

BlockletEnvironment.propTypes = {
  blocklet: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
  hasPermission: PropTypes.bool,
};

const Div = styled(Box)`
  max-width: 1536px;

  .advanced-config {
    border: 0;
    padding: 0;
  }
`;
