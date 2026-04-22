import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useMemoizedFn } from 'ahooks';

import MutateOrgDialog from '@blocklet/ui-react/lib/common/org-switch/create';

import OrgsTable from './table';
import OrgsCard from './card';
import { OrgsProvider, useOrgsContext } from './context';
import OrgDetail from './detail';
import InviteDialog from './detail/invite';
import Invitations from '../members/invitations';
import { OrgMutateRole } from './detail/passports';

function OrgsContainer({ layout = 'card', id = '' }) {
  const { t } = useLocaleContext();
  const { mutationParams, inviteParams, orgDetail, requests, passportParams, onCancelMutateOrg, refresh } =
    useOrgsContext();
  const { invitations, org } = orgDetail || {};
  const { showInvite, showInviting, onTriggerInvitingDialog } = inviteParams || {};

  const renderContainer = () => {
    if (id) {
      return <OrgDetail id={id} />;
    }
    return layout === 'table' ? <OrgsTable /> : <OrgsCard />;
  };

  const refreshInvitations = useMemoizedFn(() => {
    requests.getOrgInvitations(org.id);
  });

  return (
    <Box>
      {renderContainer()}
      {mutationParams.mode ? (
        <MutateOrgDialog
          mode={mutationParams.mode}
          item={mutationParams.org}
          onSuccess={() => {
            onCancelMutateOrg();
            refresh();
          }}
          onCancel={onCancelMutateOrg}
        />
      ) : null}
      {showInvite ? <InviteDialog /> : null}
      {showInviting ? (
        <Dialog
          title={t('common.inviting')}
          onClose={() => onTriggerInvitingDialog({ open: false })}
          open={showInviting}
          maxWidth="lg"
          fullWidth>
          <Invitations invitations={invitations} onRefresh={refreshInvitations} />
        </Dialog>
      ) : null}
      {passportParams.visible ? <OrgMutateRole /> : null}
    </Box>
  );
}

OrgsContainer.propTypes = {
  layout: PropTypes.oneOf(['table', 'card']),
  id: PropTypes.string,
};

export default function Orgs({ layout = 'card', mode = 'user-center', editable = true, id = '' }) {
  return (
    <OrgsProvider editable={editable} mode={mode} id={id}>
      <OrgsContainer layout={layout} id={id} />
    </OrgsProvider>
  );
}

Orgs.propTypes = {
  layout: PropTypes.oneOf(['table', 'card']),
  mode: PropTypes.oneOf(['dashboard', 'user-center']),
  editable: PropTypes.bool,
  id: PropTypes.string,
};
