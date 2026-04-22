import PropTypes from 'prop-types';
import Toast from '@arcblock/ux/lib/Toast';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { formatError } from '@blocklet/error';

import SpaceDelete from './delete';

/**
 * @typedef {import('../../../contexts/config-space').SpaceGateway} SpaceGateway
 */

/**
 * @description 空间操作按钮
 * @param {{
 *  spaceGateway: SpaceGateway,
 *  onDisconnect: () => Promise<void>
 * }} props
 */
function Action({ spaceGateway, onDisconnect = () => undefined }) {
  const { t } = useLocaleContext();
  const handleOnDisconnect = async () => {
    try {
      await onDisconnect();
      Toast.success(
        t('storage.spaces.gateway.delete.succeeded', { name: spaceGateway.name ? `(${spaceGateway.name})` : '' })
      );
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
    }
  };

  return <SpaceDelete spaceGateway={spaceGateway} onDeleteSpace={handleOnDisconnect} />;
}

Action.propTypes = {
  spaceGateway: PropTypes.shape({
    did: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    endpoint: PropTypes.string.isRequired,
  }).isRequired,
  onDisconnect: PropTypes.func,
};

export default Action;
