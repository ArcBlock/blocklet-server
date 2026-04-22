import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useMemoizedFn, useReactive } from 'ahooks';
import Toast from '@arcblock/ux/lib/Toast';
import { useConfirm } from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import { useSessionContext } from '../../contexts/session';
import { formatError } from '../../util';

const OrgsContext = createContext({});
const { Provider, Consumer } = OrgsContext;

const searchParams = {
  type: '',
  org: {},
  paging: { page: 1, pageSize: 10 },
};

// eslint-disable-next-line react/prop-types
function OrgsProvider({ children, editable = true, mode = 'user-center', id = '' }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();
  const { session } = useSessionContext();

  const [loading, setLoading] = useState(false);
  const [createCount, setCreateCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const orgDetail = useReactive({
    loading: false,
    org: null,
    members: [],
    membersPaging: { page: 1, pageSize: 10 },
    invitations: [],
    refresh: null,
    editable: false,
    roles: [],
    error: null,
  });

  const userDid = useMemo(() => {
    return session?.user?.did;
  }, [session?.user?.did]);

  const searchCache = useReactive({
    all: JSON.parse(JSON.stringify(searchParams)),
    myCreated: JSON.parse(JSON.stringify({ ...searchParams, type: 'owned' })),
    myJoined: JSON.parse(JSON.stringify({ ...searchParams, type: 'joined' })),
  });
  const mutationParams = useReactive({
    mode: '',
    org: null,
  });
  const inviteParams = useReactive({
    loading: false,
    org: null,
    showInvite: false,
    showInviting: false,
    inviteLink: '',
    roles: [],
    mode: 'list', // list, detail 表示在哪里触发的邀请，用于局部更新数据，避免多余的请求
  });

  const passportParams = useReactive({
    mode: 'create',
    item: null,
    loading: false,
    org: null,
    visible: false,
  });

  const orgSettings = useMemo(() => {
    return window.blocklet?.settings?.org || {};
  }, []);

  const { confirmApi, confirmHolder } = useConfirm();

  const getAllOrgs = useMemoizedFn(async ({ org = {}, type = '', paging = { page: 1, pageSize: 10 } }) => {
    try {
      setLoading(true);
      const result = await api.getOrgs({
        input: { teamDid, paging, org, ...(type ? { type } : {}) },
      });
      searchCache.all = {
        org,
        paging,
        type,
      };
      return result;
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
      return undefined;
    } finally {
      setLoading(false);
    }
  });

  const getMyCreatedOrgs = useMemoizedFn(async ({ org = {}, paging = { page: 1, pageSize: 10 } }) => {
    try {
      setLoading(true);
      const result = await api.getOrgs({
        input: { teamDid, paging, org, type: 'owned' },
      });
      setCreateCount(result?.paging?.total || 0);
      searchCache.myCreated = {
        org,
        paging,
        type: 'owned',
      };
      return result;
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
      return undefined;
    } finally {
      setLoading(false);
    }
  });

  const getMyJoinedOrgs = useMemoizedFn(async ({ org = {}, paging = { page: 1, pageSize: 10 } }) => {
    try {
      setLoading(true);
      const result = await api.getOrgs({
        input: { teamDid, paging, org, type: 'joined' },
      });
      searchCache.myJoined = {
        org,
        paging,
        type: 'joined',
      };
      return result;
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
      return undefined;
    } finally {
      setLoading(false);
    }
  });

  const refresh = useMemoizedFn(() => {
    setRefreshTrigger((prev) => prev + 1);
  });

  const handleDeleteOrg = useMemoizedFn(async (org) => {
    try {
      await api.deleteOrg({ input: { teamDid, id: org.id } });
      refresh();
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
    }
  });

  const deleteOrgConfirm = useMemoizedFn((org) => {
    return new Promise((resolve, reject) => {
      confirmApi.open({
        title: t('team.orgs.deleteConfirm', { name: org.name }),
        content: t('team.orgs.deleteConfirmDescription'),
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
        confirmButtonProps: {
          color: 'error',
        },
        onConfirm: async (close) => {
          await handleDeleteOrg(org);
          close();
          resolve();
        },
        onCancel: () => {
          reject();
        },
      });
    });
  });

  const handleUpdateOrg = useMemoizedFn(async (org) => {
    try {
      await api.updateOrg({
        input: { teamDid, org },
      });
      Toast.success(t('team.orgs.mutate.updateSuccess'));
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
    }
  });

  const handleCreateOrg = useMemoizedFn(async (org) => {
    try {
      await api.createOrg({
        input: { teamDid, name: org.name, description: org.description },
      });
      Toast.success(t('team.orgs.mutate.createSuccess'));
      refresh();
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
    }
  });

  const handleGetOrgMembers = useMemoizedFn(async (orgId, paging = orgDetail.membersPaging) => {
    try {
      const result = await api.getOrgMembers({ input: { teamDid, orgId, paging } });
      orgDetail.members = result.users;
      orgDetail.membersPaging = result.paging;
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
    }
  });

  const handleGetOrgInvitations = useMemoizedFn(async (orgId, paging = { page: 1, pageSize: 10 }) => {
    try {
      const result = await api.getInvitations({ input: { teamDid, orgId, paging } });
      orgDetail.invitations = result.invitations;
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
    }
  });

  const handleGetOrgRoles = useMemoizedFn(async (orgId) => {
    try {
      const result = await api.getRoles({ input: { teamDid, orgId } });
      orgDetail.roles = result.roles;
      inviteParams.roles = result.roles;
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
    }
  });

  const handleRemoveOrgMember = useMemoizedFn(async (orgId, memberDid) => {
    try {
      await api.removeOrgMember({ input: { teamDid, orgId, userDid: memberDid } });
      Toast.success(t('team.orgs.invite.removeSuccess'));
      Promise.all([handleGetOrgMembers(orgId), handleGetOrgInvitations(orgId)]);
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
    }
  });

  const removeOrgMemberConfirm = useMemoizedFn((orgId, member) => {
    const { user, status } = member;

    const inviting = status === 'inviting';
    return new Promise((resolve, reject) => {
      confirmApi.open({
        title: inviting
          ? t('team.orgs.member.removeInvitingMember', { name: user.fullName })
          : t('team.orgs.member.removeMemberConfirm', { name: user.fullName }),
        content: inviting
          ? t('team.orgs.member.removeInvitingMemberDescription', { name: user.fullName })
          : t('team.orgs.member.removeMemberConfirmDescription'),
        confirmButtonProps: {
          color: 'error',
        },
        onConfirm: async (close) => {
          await handleRemoveOrgMember(orgId, user.did);
          close();
          resolve();
        },
        onCancel: () => {
          reject();
        },
      });
    });
  });

  const handleGetOrg = useMemoizedFn(async (orgId) => {
    try {
      const result = await api.getOrg({ input: { teamDid, id: orgId } });
      orgDetail.org = result.org;
      orgDetail.error = null;
      orgDetail.editable = editable ? result?.org?.ownerDid === userDid : false;
    } catch (error) {
      orgDetail.error = formatError(error);
      console.error(error);
      Toast.error(formatError(error));
    }
  });

  const onTriggerEditOrg = useMemoizedFn((org) => {
    if (!orgSettings?.enabled) {
      Toast.error(t('team.orgs.mutate.orgNotEnabled'));
      return;
    }
    mutationParams.org = org;
    mutationParams.mode = 'update';
  });

  const onTriggerCreateOrg = useMemoizedFn(() => {
    if (!orgSettings?.enabled) {
      Toast.error(t('team.orgs.mutate.orgNotEnabled'));
      return;
    }
    const { maxOrgPerUser = 10 } = orgSettings;
    if (maxOrgPerUser <= createCount) {
      Toast.error(t('team.orgs.mutate.maxOrgPerUser', { maxOrgPerUser }));
      return;
    }
    mutationParams.org = {};
    mutationParams.mode = 'create';
  });

  const onTriggerInviteDialog = useMemoizedFn(({ org, open = false, mode: _mode = 'list' }) => {
    if (open && org) {
      inviteParams.org = org;
      inviteParams.mode = _mode;
      if (!orgSettings?.enabled) {
        Toast.error(t('team.orgs.mutate.orgNotEnabled'));
        return;
      }
      const { maxMemberPerOrg = 100 } = orgSettings;
      org.membersCount = org.membersCount || 1;
      if (maxMemberPerOrg <= (org?.membersCount ?? 1)) {
        Toast.error(t('team.orgs.mutate.maxMemberPerOrg', { maxMemberPerOrg }));
        return;
      }
      handleGetOrgRoles(org.id);
    } else {
      inviteParams.mode = 'list';
      inviteParams.org = null;
      inviteParams.roles = [];
      inviteParams.inviteLink = '';
    }
    inviteParams.showInvite = open;
  });

  const onTriggerInvitingDialog = useMemoizedFn(({ org, open = false }) => {
    inviteParams.showInviting = open;
    inviteParams.org = open ? org : null;
  });

  const onCancelMutateOrg = useMemoizedFn(() => {
    mutationParams.org = null;
    mutationParams.mode = '';
  });

  const handleGetOrgDetail = useMemoizedFn(async (orgId) => {
    try {
      orgDetail.loading = true;
      await handleGetOrg(orgId);
      if (orgDetail.error) {
        return;
      }
      if (orgDetail.editable) {
        await Promise.all([handleGetOrgMembers(orgId), handleGetOrgInvitations(orgId), handleGetOrgRoles(orgId)]);
      } else {
        await Promise.all([handleGetOrgMembers(orgId), handleGetOrgRoles(orgId)]);
      }
    } catch (error) {
      console.error(error);
      // 错误提示在每个请求中已经处理过了
    } finally {
      orgDetail.loading = false;
    }
  });

  const handleInviteMembers = useMemoizedFn(async ({ userDids, role, email, inviteType }) => {
    try {
      const { org } = inviteParams || {};
      if (!org) {
        throw new Error(400, 'Org is not found');
      }
      inviteParams.loading = true;

      const res = await api.inviteMembersToOrg({
        input: { userDids, email, teamDid, orgId: org.id, role, inviteType },
      });
      const { failedDids, inviteLink: _inviteLink } = res.data || {};
      if (inviteType === 'external') {
        inviteParams.inviteLink = _inviteLink;
      } else if (!failedDids.length) {
        Toast.success(t('team.orgs.invite.success'));
      } else {
        Toast.success(t('team.orgs.invite.failed', { count: failedDids.length }));
      }
      if (inviteParams.mode === 'detail') {
        handleGetOrgDetail(org.id);
      } else {
        refresh();
      }
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
    } finally {
      inviteParams.loading = false;
    }
  });

  const onTriggerPassportDialog = useMemoizedFn(({ org, mode: _mode = 'create', open = false, item = null }) => {
    passportParams.visible = open;
    passportParams.org = open ? org : null;
    passportParams.mode = open ? _mode : 'create';
    passportParams.item = open && _mode === 'update' ? item : null;
  });

  useEffect(() => {
    if (id) {
      handleGetOrgDetail(id);
    }
  }, [id, handleGetOrgDetail]);

  const state = {
    editable,
    refresh,
    refreshTrigger,
    loading,
    mode,
    teamDid,
    onTriggerEditOrg,
    onTriggerCreateOrg,
    onCancelMutateOrg,
    mutationParams,
    inviteParams: {
      ...inviteParams,
      onTriggerInviteDialog,
      onTriggerInvitingDialog,
    },
    orgDetail: { ...orgDetail, refresh: handleGetOrgDetail },
    passportParams: { ...passportParams, onTriggerPassportDialog },
    requests: {
      getAllOrgs,
      getMyCreatedOrgs,
      getMyJoinedOrgs,
      deleteOrg: deleteOrgConfirm,
      updateOrg: handleUpdateOrg,
      createOrg: handleCreateOrg,
      getOrgMembers: handleGetOrgMembers,
      getOrgInvitations: handleGetOrgInvitations,
      removeOrgMember: removeOrgMemberConfirm,
      getOrg: handleGetOrg,
      inviteMembers: handleInviteMembers,
      getOrgRoles: handleGetOrgRoles,
    },
  };

  return (
    <Provider value={state}>
      {children}
      {confirmHolder}
    </Provider>
  );
}
function useOrgsContext() {
  return useContext(OrgsContext);
}

export { OrgsContext, useOrgsContext, Consumer as OrgsConsumer, OrgsProvider };
