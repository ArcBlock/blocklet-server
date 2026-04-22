/* eslint-disable react/jsx-one-expression-per-line */
import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import LaunchIcon from '@mui/icons-material/Launch';
import IconButton from '@mui/material/IconButton';
import PropTypes, { func } from 'prop-types';
import { joinURL } from 'ufo';
import styled from '@emotion/styled';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';

import SpaceGatewayDelete from './delete';

/**
 * @typedef {{
 *  name: string,
 *  url: string,
 *  protected?: boolean,
 *  selected?: boolean,
 * }} SpaceGateway
 */

/**
 *
 *
 * @export
 * @param {{
 *  spaceGateway: SpaceGateway,
 *  selected: boolean,
 *  onDeleteSpaceGateway: (spaceGateway: SpaceGateway) => Promise<void> | void,
 *  onSelectGateway: (e: MouseEvent) => void | Promise<void>,
 * }} { spaceGateway, selected, onDeleteSpaceGateway }
 * @return {React.Component}
 */
export default function SpaceSelectorItem({
  spaceGateway,
  onDeleteSpaceGateway = () => undefined,
  onSelectGateway = () => undefined,
  ...rest
}) {
  /**
   * @description
   * @param {React.MouseEvent} e
   */
  const handleOpen = e => {
    e.stopPropagation();
    // 从 gateway 相关接口中获得，可以信任
    window.open(getSafeUrlWithToast(spaceGateway.url, { allowDomains: null }));
  };

  /**
   * @description
   * @param {React.MouseEvent} e
   */
  const handleOnDeleteSpaceGateway = async () => {
    await onDeleteSpaceGateway(spaceGateway);
  };

  return (
    <BoxContainer {...rest} onClick={onSelectGateway}>
      <Box
        sx={{
          display: 'inline-flex',
          marginRight: '8px',
          alignItems: 'center',
        }}>
        <img alt={spaceGateway.name} src={joinURL(spaceGateway.url, 'favicon.ico')} width="48px" height="48px" />
      </Box>
      <Box
        className={{
          minWidth: 0,
          display: 'flex',
          flex: 1,
          flexDirection: 'row',
          paddingRight: '64px',
          '& span': {
            display: 'inline-block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        }}>
        <Typography sx={{ display: 'flex' }} component="span" variant="subtitle1" style={{ fontWeight: '400' }}>
          {spaceGateway?.name}{' '}
        </Typography>
        <Typography sx={{ display: 'flex' }} className="url" component="span" variant="inherit">
          {spaceGateway?.url}
        </Typography>
      </Box>
      <ListItemSecondaryAction>
        <IconButton onClick={handleOpen} size="small">
          <LaunchIcon />
        </IconButton>
        {spaceGateway?.protected !== true && (
          <SpaceGatewayDelete spaceGateway={spaceGateway} onDeleteSpaceGateway={handleOnDeleteSpaceGateway} />
        )}
      </ListItemSecondaryAction>
    </BoxContainer>
  );
}

const BoxContainer = styled(Box)`
  display: flex;
`;

SpaceSelectorItem.propTypes = {
  spaceGateway: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    protected: PropTypes.bool,
  }).isRequired,
  selected: PropTypes.bool,
  onDeleteSpaceGateway: PropTypes.func,
  onSelectGateway: func,
};
