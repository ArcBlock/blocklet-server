import React from 'react';
import { Box, List, ListItem, ListItemText } from '@mui/material';
import Button from '@arcblock/ux/lib/Button';
import { func } from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Selected from '@abtnode/ux/lib/blocklet/component/selected';
import { useSpaceSelectorContext } from '../../../../contexts/space-selector';
import SpaceSelectorItem from './selector-item';
import SpaceGatewayAdd from './add';

/**
 * @typedef {{
 *  url: string, // unique
 *  name: string,
 *  protected?: boolean,
 * }} SpaceGateway
 */

/**
 * @description
 * @param {{
 *   onSpaceGatewaySelected: () => void | Promise<void>,
 * }} { onSpaceGatewaySelected }
 * @return {React.Component}
 */
function ConnectSpaceSelector({ onConnect = () => undefined, ...rest }) {
  const { spaceGateways, selectedSpaceGateway, handleSelectSpaceGateway, addSpaceGateway, deleteSpaceGateway } =
    useSpaceSelectorContext();
  const { t } = useLocaleContext();

  /**
   * @description
   * @param {SpaceGateway} spaceGateway
   */
  const handleOnSelectSpaceGateway = spaceGateway => {
    handleSelectSpaceGateway(spaceGateway);
  };

  /**
   * @description
   * @param {SpaceGateway} spaceGateway
   */
  const handleOnAddGateway = async spaceGateway => {
    await addSpaceGateway(spaceGateway);
  };

  /**
   * @description
   * @param {SpaceGateway} spaceGateway
   */
  const handleOnConnect = () => {
    onConnect(selectedSpaceGateway);
  };

  /**
   * @description
   * @param {SpaceGateway} spaceGateway
   */
  const handleOnDeleteSpaceGateway = async spaceGateway => {
    await deleteSpaceGateway(spaceGateway);
  };

  return (
    <Box {...rest}>
      <List>
        {spaceGateways.map(spaceGateway => {
          const selected = spaceGateway?.url === selectedSpaceGateway.url;
          return (
            <Selected selected={selected}>
              <ListItem key={spaceGateway.url} button selected={selected} data-cy="get-space-endpoint-for-restore">
                <ListItemText>
                  <SpaceSelectorItem
                    spaceGateway={spaceGateway}
                    onDeleteSpaceGateway={handleOnDeleteSpaceGateway}
                    selected={selected}
                    onSelectGateway={() => handleOnSelectSpaceGateway(spaceGateway)}
                  />
                </ListItemText>
              </ListItem>
            </Selected>
          );
        })}
      </List>
      <Box
        sx={{
          display: 'flex',
          marginTop: '16px',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <SpaceGatewayAdd onAddGateway={handleOnAddGateway} />
        <Button sx={{ marginLeft: '16px' }} size="middle" variant="contained" onClick={handleOnConnect}>
          {t('storage.spaces.connect.now')}
        </Button>
      </Box>
    </Box>
  );
}

ConnectSpaceSelector.propTypes = {
  onConnect: func,
};

export default ConnectSpaceSelector;
