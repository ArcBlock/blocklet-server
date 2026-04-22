import { useState } from 'react';
import { Box, Button } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import AddIcon from '@mui/icons-material/Add';
import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import EditIcon from '@arcblock/icons/lib/EditIcon';
import LockIcon from '@arcblock/icons/lib/LockIcon';

import { useOrgsContext } from '../context';
import MutateRole from '../../passports/mutate-role';
import { PassportItem, Div } from '../../passports';
import { createPassportSvg } from '../../../util/passport';
import { PassportDetail } from '../../passports/detail';
import { isProtectedRole } from '../../../util';

export default function OrgPassports() {
  const { orgDetail, requests } = useOrgsContext();
  const { roles, org, editable } = orgDetail || {};
  const [updateForm, setUpdateForm] = useState(false);

  const passportColor =
    (window.blocklet?.environments || []).find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_PASSPORT_COLOR)
      ?.value || 'auto';

  return (
    <Div>
      <Box className="list">
        {roles.map((role) => (
          <PassportItem
            key={role.name}
            role={role}
            createPassportSvg={createPassportSvg}
            onUpdate={setUpdateForm}
            actions={
              editable ? <div className="action">{isProtectedRole(role.name) ? <LockIcon /> : <EditIcon />}</div> : null
            }
            passportProps={{
              issuer: org.name,
              issuerDid: org.ownerDid,
              ownerDid: org.ownerDid,
              preferredColor: passportColor,
            }}
          />
        ))}
      </Box>
      {updateForm && (
        <PassportDetail
          onCancel={() => setUpdateForm(false)}
          roles={roles}
          onSuccess={() => {
            setUpdateForm(false);
            requests.getOrgRoles(org.id);
          }}
          onDelete={() => {
            setUpdateForm(false);
            requests.getOrgRoles(org.id);
          }}
          mode="update"
          roleName={updateForm.name}
          item={updateForm}
          orgId={org.id}
          hasPermission={editable}
        />
      )}
    </Div>
  );
}

export function OrgPassportsExtra() {
  const { t } = useLocaleContext();
  const { orgDetail, passportParams } = useOrgsContext();
  const { org, editable } = orgDetail || {};

  if (!editable) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="contained"
        size="small"
        onClick={() => {
          passportParams.onTriggerPassportDialog({ org, open: true });
        }}
        startIcon={<AddIcon />}>
        {t('team.passport.create.title')}
      </Button>
    </Box>
  );
}

export function OrgMutateRole() {
  const { teamDid, passportParams, requests } = useOrgsContext();

  const { visible, org } = passportParams || {};
  if (!visible) {
    return null;
  }

  return (
    <MutateRole
      teamDid={teamDid}
      orgId={org.id}
      onCancel={() => passportParams.onTriggerPassportDialog({ open: false })}
      onSuccess={() => {
        passportParams.onTriggerPassportDialog({ open: false });
        requests.getOrgRoles(org.id);
      }}
    />
  );
}
