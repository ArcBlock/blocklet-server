import { useState, useContext } from 'react';
import PropTypes from 'prop-types';

import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import BlockAccessIcon from '@arcblock/icons/lib/ForbidLoginIcon';
import AllowAccessIcon from '@arcblock/icons/lib/AllowLoginIcon';
import { getWalletDid } from '@blocklet/meta/lib/did-utils';
import { useConfirm } from '@arcblock/ux/lib/Dialog';
import { useMemoizedFn } from 'ahooks';

import { useTeamContext } from '../../contexts/team';
import Actions from '../../actions';
import IssuePassport from './issue-passport';
import ToggleAccess from './toggle-access';
import { useNodeContext } from '../../contexts/node';

export default function MemberActions({ type, user, onIssuePassport = () => {}, onRefresh = () => {} }) {
  const { teamDid, roles } = useTeamContext();
  const { confirmHolder, confirmApi } = useConfirm();
  const { t } = useContext(LocaleContext);
  const [enablePassportIssuance, setEnablePassportIssuance] = useState(false);
  const { api } = useNodeContext();
  const logoutUser = useMemoizedFn(async (removeAll = false) => {
    const params = {
      teamDid,
      userDid: user.did,
      remove: removeAll,
    };
    if (!removeAll) {
      params.appPid = teamDid;
    }
    await api.logoutUser({
      input: params,
    });
  });

  return (
    <>
      {confirmHolder}
      <Actions
        data-cy="member-actions"
        actions={[
          {
            icon: <AddIcon fontSize="small" />,
            text: t('team.passport.issue'),
            'data-cy': 'action-issue-passport',
            onClick: (e) => {
              e.stopPropagation();
              setEnablePassportIssuance(true);
            },
          },
          // eslint-disable-next-line react/no-unstable-nested-components
          ({ close }) => (
            <ToggleAccess user={user} key="toggle-approval">
              {({ open: o }) => (
                <MenuItem
                  dense
                  onClick={(e) => {
                    e.stopPropagation();
                    close();
                    o(e);
                  }}
                  data-cy="action-toggle-block">
                  <ListItemIcon style={{ minWidth: 24, marginRight: 8 }}>
                    {user.approved ? <BlockAccessIcon /> : <AllowAccessIcon />}
                  </ListItemIcon>
                  <ListItemText primary={user.approved ? t('team.member.blockAccess') : t('team.member.allowAccess')} />
                </MenuItem>
              )}
            </ToggleAccess>
          ),
          type === 'blocklet' && {
            icon: <LogoutIcon fontSize="small" />,
            text: t('team.member.forceLogout'),
            onClick: (e) => {
              e.stopPropagation();
              confirmApi.open({
                title: t('team.member.forceLogout'),
                content: e.altKey
                  ? t('team.member.forceLogoutRemoveDescription')
                  : t('team.member.forceLogoutDescription'),
                confirmButtonText: t('common.confirm'),
                cancelButtonText: t('common.cancel'),
                onClick: (event) => event.stopPropagation(),
                onConfirm: async () => {
                  await logoutUser(e.altKey);
                  await confirmApi.close();
                  onRefresh();
                },
              });
            },
          },
        ].filter(Boolean)}
      />
      {enablePassportIssuance && (
        <IssuePassport
          teamDid={teamDid}
          ownerDid={user.did}
          needReceive={getWalletDid(user) === user.did}
          roles={roles}
          onCancel={() => setEnablePassportIssuance(false)}
          onSuccess={() => {
            onIssuePassport();
            setEnablePassportIssuance(false);
          }}
        />
      )}
    </>
  );
}

MemberActions.propTypes = {
  type: PropTypes.oneOf(['server', 'blocklet']).isRequired,
  user: PropTypes.object.isRequired,
  onIssuePassport: PropTypes.func,
  onRefresh: PropTypes.func,
};
