import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import React, { useContext } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

import { useNodeContext } from '../contexts/node';
import { isInstalling, BlockletAdminRoles } from '../util';
import { withPermission } from '../permission';
import Branding from './branding';
import DangerZone from './danger-zone';

function BlockletEnvironment({ blocklet, onUpdate = () => {}, hasPermission = false, ...rest }) {
  const { t } = useContext(LocaleContext);

  if (isInstalling(blocklet.status)) {
    return null;
  }

  return (
    <ConfigurationContainer {...rest}>
      <Branding blocklet={blocklet} onUpdate={onUpdate} hasPermission={hasPermission} />
      <Box
        sx={{
          mt: 6,
        }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
          }}>
          {t('blocklet.config.dangerZone')}
        </Typography>
      </Box>
      <Box
        className="config-form"
        component={Divider}
        sx={{
          my: 3,
        }}
      />
      <Box
        sx={{
          maxWidth: 1536,
        }}>
        <DangerZone blocklet={blocklet} onUpdate={onUpdate} hasPermission={hasPermission} />
      </Box>
    </ConfigurationContainer>
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

const ConfigurationContainer = styled(Box)`
  .config-form {
    flex-grow: 1;
    overflow-y: auto;
    ${(props) => props.theme.breakpoints.down('md')} {
      width: 100%;
      flex-shrink: 0;
      padding: 0 24px;
      transform: translate(0, 0);
    }
  }

  .config-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 16px 0;
  }

  .config-label {
    font-weight: bold;
  }

  .config-desc {
    font-weight: normal;
    font-size: 12px;
    color: #666;
  }

  .form-item {
    margin-top: 0;
  }
`;
