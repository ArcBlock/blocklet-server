import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import cloneDeep from 'lodash/cloneDeep';

import Dialog from '@arcblock/ux/lib/Dialog';
import Spinner from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import EditIcon from '@arcblock/icons/lib/EditIcon';
import DeleteIcon from '@arcblock/icons/lib/DeleteIcon';
import Toast from '@arcblock/ux/lib/Toast';

import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import { formatError, isProtectedRole, BlockletAdminRoles } from '../../util';
import { withPermission } from '../../permission';
import Confirm from '../../confirm';
import MutateRole from './mutate-role';

function PassportDetail({
  onCancel,
  onSuccess,
  onDelete,
  roleName,
  roles = undefined,
  hasPermission = false,
  orgId = '',
}) {
  const { api } = useNodeContext();
  const { roles: teamRoles, permissions, teamDid, refresh: refreshTeam, isNodeTeam } = useTeamContext();
  const { t } = useLocaleContext();
  const [binds, setBinds] = useState([]);
  const [updateForm, setUpdateForm] = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  const allRoles = useMemo(() => {
    return roles || teamRoles;
  }, [roles, teamRoles]);

  const role = cloneDeep(allRoles.find((x) => x.name === roleName));

  const isProtected = isProtectedRole(roleName);

  const deletePassport = async (name) => {
    if (loading) return;
    try {
      setLoading(true);
      await api.deleteRole({ input: { teamDid, name } });
      onDelete();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
      setDelConfirm(null);
    }
  };

  const getData = async (team, name) => {
    const res = await api.getPermissionsByRole({ input: { teamDid: team, role: { name } } });
    const permissionList = res.permissions || [];
    const bindList = permissions.map((x) => ({
      ...x,
      bind: permissionList.some((y) => y.name === x.name),
    }));
    setBinds(bindList);
  };

  const onBind = async () => {
    setLoading(true);

    const grantNames = binds.filter((x) => x.bind).map((x) => x.name);

    try {
      await api.updatePermissionsForRole({ input: { teamDid, roleName: role.name, grantNames } });
      Toast.success(t('common.saveSuccess'));
      onSuccess();
    } catch (err) {
      Toast.error(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamDid && roleName) {
      getData(teamDid, roleName);
    }
  }, [teamDid, roleName]); // eslint-disable-line

  const readPermissionsOnly = isNodeTeam || !hasPermission;

  let bindPermission = null;
  if (isNodeTeam) {
    bindPermission = (
      <div className="bind">
        <div className="title">{t('common.permission')}</div>
        <div className="list">
          {binds
            // if readonly, show obtained permissions only
            .filter((x) => (readPermissionsOnly ? x.bind : true))
            .map((x) => (
              <div className="item">
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled={readPermissionsOnly}
                      checked={x.bind}
                      onChange={() => {
                        setBinds((state) =>
                          state.map((y) => {
                            if (y.name === x.name) {
                              y.bind = !y.bind;
                            }
                            return y;
                          })
                        );
                      }}
                      name={x.name}
                    />
                  }
                  label={x.description}
                />
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <Dialog
      title={t('common.passport')}
      onClose={onCancel}
      open
      fullWidth
      toolbar={
        hasPermission &&
        !isProtected && (
          <>
            <IconButton onClick={() => setUpdateForm(role)} data-cy={`edit-passport-${role.name}`} size="large">
              <EditIcon fill="#bfbfbf" />
            </IconButton>
            <IconButton
              onClick={() =>
                setDelConfirm({
                  title: t('team.passport.delete.title'),
                  description: t('team.passport.delete.description', { name: role.title }),
                  confirm: t('common.delConfirm'),
                  cancel: t('common.cancel'),
                  onConfirm: () => {
                    deletePassport(role.name);
                  },
                  onCancel: () => {
                    setLoading(false);
                    setDelConfirm(null);
                  },
                })
              }
              data-cy={`delete-passport-${role.name}`}
              size="large">
              <DeleteIcon data-cy="close-passport-dialog" fill="#bfbfbf" />
            </IconButton>
          </>
        )
      }
      actions={
        isNodeTeam &&
        !readPermissionsOnly && (
          <>
            <Button onClick={onCancel} color="inherit">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={onBind}
              color="primary"
              disabled={loading || !role}
              variant="contained"
              autoFocus
              data-cy="bind-permission-btn-confirm">
              {loading && <Spinner size={16} />}
              {t('common.save')}
            </Button>
          </>
        )
      }>
      <Div>
        {!role && (
          <Center>
            <Spinner />
          </Center>
        )}

        {/* content */}
        {role && (
          <div className="dialog-content">
            <div className="header">
              <div className="title">{role.title}</div>
              <div className="description" style={{ marginTop: isNodeTeam ? 16 : 48 }}>
                {role.description}
              </div>
            </div>

            {bindPermission}
          </div>
        )}
      </Div>

      {updateForm && (
        <MutateRole
          teamDid={teamDid}
          onCancel={() => setUpdateForm(null)}
          onSuccess={() => {
            setUpdateForm(null);
            if (orgId) {
              onSuccess();
            } else {
              refreshTeam();
            }
          }}
          mode="update"
          roleName={updateForm.name}
          item={updateForm}
          orgId={orgId}
        />
      )}

      {delConfirm && (
        <Confirm
          title={delConfirm.title}
          description={delConfirm.description}
          confirm={delConfirm.confirm}
          cancel={delConfirm.cancel}
          params={delConfirm.params}
          onConfirm={delConfirm.onConfirm}
          onCancel={delConfirm.onCancel}
        />
      )}
    </Dialog>
  );
}

const PassportDetailInDaemon = withPermission(PassportDetail, 'mutate_team');
const PassportDetailInService = withPermission(PassportDetail, '', BlockletAdminRoles);

export default function PassportDetailWithPermission(props) {
  const { inService } = useNodeContext();
  if (inService) {
    return <PassportDetailInService {...props} />;
  }

  return <PassportDetailInDaemon {...props} />;
}

export { PassportDetail };

PassportDetail.propTypes = {
  roleName: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  hasPermission: PropTypes.bool,
  roles: PropTypes.array,
  orgId: PropTypes.string,
};

const Div = styled.div`
  .header {
    .title {
      font-weight: 400;
      font-size: 24px;
      line-height: 28px;
      color: ${({ theme }) => theme.palette.text.primary};
    }

    .description {
      margin-top: 16px;
      font-weight: 400;
      font-size: 16px;
      line-height: 19px;
      color: ${({ theme }) => theme.palette.text.secondary};
    }
  }

  .bind {
    margin-top: 24px;
    .title {
      font-weight: 400;
      font-size: 16px;
      line-height: 19px;
      color: ${({ theme }) => theme.palette.text.secondary};
      margin-bottom: 24px;
    }
    .item {
      margin-top: 24px;
    }

    .MuiFormControlLabel-label {
      font-weight: 400;
      font-size: 16px;
      line-height: 19px;
      color: ${({ theme }) => theme.palette.text.secondary};
    }

    .PrivateSwitchBase-root-45 {
      padding: 0;
      padding-right: 12px;
    }
  }
`;

const Center = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;
