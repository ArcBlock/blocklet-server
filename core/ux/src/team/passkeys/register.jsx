import noop from 'lodash/noop';
import { PasskeyActions } from '@arcblock/did-connect-react/lib/Passkey';
import PropTypes from 'prop-types';

import { useTeamContext } from '../../contexts/team';

export default function RegisterPasskey({ hasPasskey = false, refresh = noop }) {
  const { isNodeTeam } = useTeamContext();

  if (!isNodeTeam) {
    return null;
  }

  return (
    <PasskeyActions
      behavior="only-new"
      action="connect"
      createMode="connect"
      createButtonText={hasPasskey ? 'Add New Passkey' : 'Add Passkey'}
      onSuccess={refresh}
      onError={noop}
      dense
    />
  );
}

RegisterPasskey.propTypes = {
  hasPasskey: PropTypes.bool,
  refresh: PropTypes.func,
};
