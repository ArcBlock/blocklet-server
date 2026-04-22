/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable jsx-a11y/aria-role */
import { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from '@emotion/styled';
import isEmpty from 'lodash/isEmpty';
import { noop } from 'lodash';
import PropTypes from 'prop-types';

import { Badge, IconButton, Tooltip, Checkbox, Box, FormControlLabel } from '@mui/material';
import Dialog from '@arcblock/ux/lib/Dialog';
import AddIcon from '@mui/icons-material/Add';
import LoopIcon from '@mui/icons-material/Loop';
import ViewListIcon from '@mui/icons-material/ViewList';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import PersonIcon from '@arcblock/icons/lib/PersonIcon';
import ExternalIssuerIcon from '@arcblock/icons/lib/ExternalIssuerIcon';
import Datatable, { getDurableData } from '@arcblock/ux/lib/Datatable';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType } from '@arcblock/ux/lib/UserCard/types';
import Toast from '@arcblock/ux/lib/Toast';
import { USER_TYPE, WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { TeamEvents } from '@blocklet/constant';
import { LOGIN_PROVIDER_NAME } from '@arcblock/ux/lib/Util/constant';
import useUrlState from '@ahooksjs/use-url-state';
import { useMemoizedFn, useMount, useCreation, useLocalStorageState, useReactive } from 'ahooks';
import { getBlockletInfo } from '@blocklet/meta/lib/info';
import { joinURL } from 'ufo';
import SplitButton from '@arcblock/ux/lib/SplitButton';
import Avatar from '@arcblock/ux/lib/Avatar';

import LabelChip from '../../blocklet/labels/chip';
import DidAddress from '../../did-address';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import { useBlockletContext } from '../../contexts/blocklet';
import { useSessionContext } from '../../contexts/session';
import { LabelsProvider, useLabels } from '../../blocklet/labels/context/context';
import ManageLabels from '../../blocklet/labels/list';
import LabelPicker from '../../blocklet/labels/picker/label';
import LabelsInput from '../../blocklet/labels/picker/label-input';
import Permission from '../../permission';
import { BlockletAdminRoles, getBlockletAccessibleUrl } from '../../util';
import InviteMember from './invite-member';
import TransferMember from './transfer-node';
import Member from './member';
import Invitations from './invitations';
import Actions from './actions';
import { parseAvatar } from './util';
import ShortenLabel from '../../blocklet/component/shorten-label';
import { MembersLabelsProvider, useMembersLabels } from './label-provider';
import UserSessions from '../user-session';
import SimpleSelect from '../../simple-select';

const ROLE_ALL = '$all';
const ROLE_NONE = '$none';
const ROLE_BLOCKED = '$blocked';

const getCount = (counts, name) => {
  const item = counts.find((x) => x.key === name);
  return item?.value || 0;
};

const isFromExternal = (user, appIdList) => {
  const list = user.passports || [];
  if (!list.length) {
    return false;
  }

  return !list.some((z) => appIdList.includes(z.issuer?.id));
};

function SimpleInfo({ user }) {
  const { t } = useContext(LocaleContext);
  const { blocklet } = useTeamContext();
  const { info: nodeInfo } = useNodeContext();

  const isBlockletOwner = user.did === blocklet?.settings?.owner?.did;
  const isNodeOwner = user.did === nodeInfo?.nodeOwner?.did;

  const userInfo = useCreation(() => {
    return {
      ...user,
      avatar: `${user.avatar}?imageFilter=resize&w=48&h=48`,
    };
  }, [user]);

  const main = (
    <div className="member-block">
      <div className="member-avatar">
        <UserCard user={userInfo} avatarSize={32} cardType={CardType.AvatarOnly} showHoverCard={false} />
        {isBlockletOwner || isNodeOwner ? (
          <Tooltip title={t('team.member.currentOwner')} placement="top">
            <div className="badge-owner" />
          </Tooltip>
        ) : null}
        {!user.approved && <div className="badge-block" />}
        {user.isFromExternal && (
          <Tooltip title={t('team.passport.externalPassport')}>
            <Box
              className="icon"
              sx={{
                ml: 1,
              }}>
              <ExternalIssuerIcon />
            </Box>
          </Tooltip>
        )}
      </div>
      <div className="member-meta">
        <div className="member-text">
          <ShortenLabel>{user.fullName}</ShortenLabel>
        </div>
        {Array.isArray(user.tags) && user.tags.length > 0 && (
          <Box
            className="member-tags"
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.5,
              maxWidth: { xs: 200, md: 'none' },
            }}>
            {user.tags.map((x) => (
              <LabelChip key={x.id} label={x} />
            ))}
          </Box>
        )}
      </div>
    </div>
  );

  return user.approved ? (
    main
  ) : (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}>
      <Tooltip title={t('team.member.blockAccessDescription')}>{main}</Tooltip>
    </Box>
  );
}

SimpleInfo.propTypes = {
  user: PropTypes.object.isRequired,
};

function MemberList({ type, createPassportSvg }) {
  const { session } = useSessionContext();
  const { appIdList = [], blocklet } = useBlockletContext();
  const { refetch } = useLabels();
  const { teamDid, invitations, teamIssuerDid, roles, refresh, enablePassportIssuance, endpoint, api } =
    useTeamContext();
  const { showManageLabels, setShowManageLabels, labelManageActions } = useMembersLabels();

  const showUserSessionParams = useReactive({
    show: false,
    user: null,
    showAppPid: false,
    getUserSessions: noop,
  });

  const {
    api: client,
    inService,
    ws: { useSubscription },
    info: nodeInfo,
  } = useNodeContext();
  const appInfoList = [];
  let isFederated = false;
  if (blocklet) {
    const federatedMaster = (blocklet.settings?.federated?.sites || []).find((item) => item.isMaster !== false);
    const federatedCurrent = (blocklet.settings?.federated?.sites || []).find((item) => item.appId === blocklet.appDid);
    isFederated = !!federatedMaster || !!federatedCurrent;
    if (federatedCurrent?.status === 'approved') {
      appInfoList.push({
        appId: federatedMaster?.appId,
        appName: federatedMaster?.appName,
        appDescription: federatedMaster?.appDescription,
        appLogo: federatedMaster?.appLogo,
        appPid: federatedMaster?.appPid,
        appUrl: federatedMaster?.appUrl,
        version: federatedMaster?.version,
        sourceAppPid: federatedMaster?.appPid,
        provider: 'wallet',
      });
    }
    if (federatedCurrent) {
      appInfoList.push({
        appId: federatedCurrent?.appId || blocklet.appDid,
        appName: federatedCurrent?.appName,
        appDescription: federatedCurrent?.appDescription,
        appLogo: federatedCurrent?.appLogo,
        appPid: federatedCurrent?.appPid,
        appUrl: federatedCurrent?.appUrl,
        version: federatedCurrent?.version,
        // NOTICE: null 代表该值置空
        sourceAppPid: null,
        provider: 'wallet',
      });
    } else {
      const blockletInfo = getBlockletInfo(blocklet, undefined, { returnWallet: false });
      appInfoList.push({
        appId: blockletInfo.did,
        appName: blockletInfo.name,
        appDescription: blockletInfo.description,
        appLogo: joinURL(blockletInfo.appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet/logo'),
        appPid: blocklet?.appPid,
        appUrl: blockletInfo.appUrl,
        version: blockletInfo.version,
        // NOTICE: null 代表该值置空
        sourceAppPid: null,
        provider: 'wallet',
      });
    }
  }

  const { t, locale } = useContext(LocaleContext);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showTransferMember, setShowTransferMember] = useState(false);
  const [showInviting, setShowInviting] = useState(false);
  const [memberDialog, setMemberDialog] = useState(false); // member, inviting
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [rowCount, setRowCount] = useState();
  const [userCounts, setUserCounts] = useState([]);
  const [urlState] = useUrlState({ did: undefined });
  const [appUrl, setAppUrl] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [labels, setLabels] = useState([]);
  const [filterLabels, setFilterLabels] = useLocalStorageState('members-filter-labels', []);

  const durableKey = `members-${teamDid}`;
  const tableDurableData = getDurableData(durableKey);

  const [search, setSearch] = useState({
    role: ROLE_ALL,
    searchText: tableDurableData.searchText || '',
    hideBlocked: false,
    pageSize: tableDurableData.rowsPerPage || 10,
    page: 1,
    createdByAppPid: undefined,
  });

  const isTemporaryRole = useMemo(() => {
    if (!inService) {
      return false;
    }

    if (!session?.user) {
      return true;
    }

    const role = session?.user?.role;
    const passports = session?.user?.passports || [];
    const roleMatchedPassports = passports.filter((x) => x.role === role);

    if (roleMatchedPassports.length === 0) {
      return true;
    }

    return roleMatchedPassports.every((x) => x.expirationDate);
  }, [session?.user, inService]);

  const getAccessibleUrl = useCallback(async () => {
    if (teamDid === nodeInfo.did) {
      setAppUrl('');
      return;
    }
    const url = await getBlockletAccessibleUrl(blocklet);
    setAppUrl(url);
  }, [blocklet, teamDid, nodeInfo.did]);

  useMount(async () => {
    if (urlState.did) {
      const { user } = await api.getUser({ did: urlState.did });
      if (user) {
        setMemberDialog(user);
      }
    }
  });

  useEffect(() => {
    getAccessibleUrl();
  }, [getAccessibleUrl]);

  const sideList = (roles || []).map((x) => ({
    name: x.name,
    title: x.title,
    num: getCount(userCounts, x.name),
  }));
  sideList.unshift({
    name: ROLE_ALL,
    title: 'All Members',
    num: getCount(userCounts, ROLE_ALL),
  });
  sideList.push({
    name: ROLE_NONE,
    title: 'Other',
    num: getCount(userCounts, ROLE_NONE),
  });
  sideList.push({
    name: ROLE_BLOCKED,
    title: 'Blocked',
    num: getCount(userCounts, ROLE_BLOCKED),
  });

  const getUsersInfo = () => {
    const query = { includeTags: true, includeUserSessions: type === 'blocklet' };

    if (search.hideBlocked) {
      query.approved = true;
    }

    if (search.createdByAppPid) {
      query.createdByAppPid = search.createdByAppPid;
    }

    query.role = search.role;

    if (search.searchText) {
      query.search = search.searchText;
    }

    query.tags = filterLabels || [];

    api
      .getUsers({
        query,
        paging: {
          page: search.page,
          pageSize: search.pageSize,
        },
      })
      .then((res) => {
        setLoading(false);

        (res.users || []).forEach((x) => {
          x.isFromExternal = isFromExternal(x, isEmpty(appIdList) ? [teamIssuerDid] : appIdList);
          x.avatar = parseAvatar(x.avatar, teamDid, inService);

          // for backwards compatibility
          x.passports = (x.passports || []).filter((y) => y.issuer);
        });

        setUsers(res.users || []);
        setRowCount(res.paging.total);
      })
      .catch((err) => {
        setLoading(false);
        Toast.error(err.message);
      });
  };

  const getUsers = () => {
    setLoading(true);
    getUsersInfo();
  };

  const getUserCounts = () => {
    api
      .getUsersCountPerRole()
      .then((res) => {
        setUserCounts(res.counts || []);
      })
      .catch((err) => {
        Toast.error(err.message);
      });
  };

  const handleUserChange = (data) => {
    if (data.teamDid === teamDid) {
      getUsers();
      getUserCounts();
    }
  };

  useEffect(() => {
    getUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search.hideBlocked,
    search.role,
    search.page,
    search.pageSize,
    search.searchText,
    search.createdByAppPid,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (filterLabels || []).join(','),
  ]);

  // user counts
  useEffect(() => {
    getUserCounts();
  }, []); //eslint-disable-line

  useSubscription(TeamEvents.userUpdated, handleUserChange, [search]);
  useSubscription(TeamEvents.userAdded, handleUserChange, [search]);

  const isInvitationEnabled = enablePassportIssuance;

  const triggerUserSessions = useMemoizedFn((open = false, user = null, showAppPid = false) => {
    if (open) {
      const getUserSessionsFn = async ({ page = 1, pageSize = 10, status } = {}) => {
        const query = {
          userDid: user.did,
          status,
        };
        if (!showAppPid) {
          query.appPid = teamDid;
        }

        const result = await client.getUserSessions({
          input: {
            teamDid,
            query,
            paging: {
              pageSize,
              page,
            },
          },
        });
        return result;
      };

      showUserSessionParams.show = true;
      showUserSessionParams.user = user;
      showUserSessionParams.showAppPid = showAppPid;
      showUserSessionParams.getUserSessions = getUserSessionsFn;
    } else {
      showUserSessionParams.show = false;
      showUserSessionParams.user = null;
      showUserSessionParams.showAppPid = false;
      showUserSessionParams.getUserSessions = noop;
    }
  });

  const columns = [
    {
      label: t('common.name'),
      name: 'fullName',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const x = users[rawIndex];

          return (
            <Box data-cy={`member-name-${x.fullName}`} key={x.did}>
              <SimpleInfo user={x} />
            </Box>
          );
        },
      },
    },
    {
      label: t('common.address'),
      name: 'did',
      options: {
        customBodyRender: (e) => {
          return <DidAddress size={14} responsive={false} compact copyable={false} did={e} />;
        },
      },
    },
    {
      label: t('team.member.lastLogin'),
      name: 'lastLoginAt',
      options: {
        customBodyRender: (e) => {
          return (
            <Box sx={{ minWidth: '100px' }}>
              <RelativeTime value={e} locale={locale} />
            </Box>
          );
        },
      },
    },
    {
      label: t('team.member.lastLoginIp'),
      name: 'lastLoginIp',
      options: {
        customBodyRender: (e) => {
          return e || '-';
        },
      },
    },
    {
      label: t('team.member.source'),
      name: 'sourceProvider',
      options: {
        customBodyRenderLite: (rowIndex) => {
          const user = users[rowIndex];
          const source = user.sourceProvider || USER_TYPE.WALLET;
          const providerName = LOGIN_PROVIDER_NAME[source] || source;
          if (user.sourceAppPid) {
            return `${providerName} (${t('team.member.federated')})`;
          }
          return providerName;
        },
      },
    },
    type === 'blocklet' && {
      label: t('team.member.activeUserSessions'),
      name: 'userSessions',
      options: {
        customBodyRenderLite: (rowIndex) => {
          const user = users[rowIndex];
          return (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                triggerUserSessions(true, user, e.altKey);
              }}>
              <Badge
                badgeContent={user?.userSessionsCount}
                color={user?.userSessionsCount > 0 ? 'primary' : 'default'}
                sx={
                  user?.userSessionsCount > 0
                    ? {}
                    : {
                        '.MuiBadge-badge': {
                          backgroundColor: 'grey',
                          color: 'white',
                        },
                      }
                }
                showZero>
                <ViewListIcon />
              </Badge>
            </IconButton>
          );
        },
      },
    },
    {
      label: t('common.actions'),
      name: '',
      width: 100,
      align: 'center',
      verticalKeyAlign: 'center',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const x = users[rawIndex];

          return (
            <Permission permission={inService ? '' : 'mutate_team'} role={inService ? BlockletAdminRoles : []}>
              <Actions
                type={type}
                user={x}
                onIssuePassport={() => setMemberDialog({ ...x, initTab: 'issuances' })}
                onRefresh={() => handleUserChange({ teamDid })}
              />
            </Permission>
          );
        },
      },
    },
  ].filter(Boolean);

  const federatedSites = blocklet?.settings?.federated?.sites || [];
  const customButtons = [];

  if (type === 'blocklet' && federatedSites.length > 0) {
    customButtons.push(
      <SimpleSelect
        margin="dense"
        size="small"
        height={36}
        sx={{
          width: 130,
          height: 36,
          mr: 1,
          '& .MuiSelect-select': {
            py: 0,
          },
        }}
        label="Select App"
        renderValue={(selected) => {
          const selectedSite = federatedSites.find((x) => x.appPid === selected);
          return selectedSite?.appName || selected;
        }}
        options={federatedSites.map((x) => ({
          value: x.appPid,
          title: (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  lineHeight: 1,
                }}>
                <Avatar did={x.appPid} size={16} />
                {x.appName}
              </Box>
              <DidAddress
                size={12}
                did={x.appPid}
                compact={false}
                responsive={false}
                sx={{
                  '& .arc-avatar-did-motif': {
                    display: 'none !important',
                  },
                }}
              />
            </Box>
          ),
        }))}
        slotProps={{
          optionItem: {
            sx: {
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            },
          },
          label: {
            sx: { fontSize: 14 },
          },
        }}
        onChange={(e) => {
          const { value } = e.target;
          setSearch((x) => ({ ...x, createdByAppPid: value, page: 1 }));
        }}
      />
    );
  }

  customButtons.push(
    <LabelsInput
      value={filterLabels || []}
      onChange={setFilterLabels}
      sx={{ maxWidth: 300, height: 36 }}
      LabelPickerProps={{
        enableAccessControl: false,
        actions: labelManageActions,
      }}
    />
  );

  if (isInvitationEnabled) {
    if (!isTemporaryRole) {
      customButtons.push(
        <SplitButton
          variant="contained"
          menuButtonProps={{ 'data-cy': 'invite-member-more' }}
          menu={
            <SplitButton.Item
              variant="outlined"
              style={{ flexShrink: 0 }}
              color="primary"
              size="small"
              onClick={() => {
                setShowInviting(true);
              }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon style={{ height: '1em', marginRight: 4 }} />
                {t('common.inviting')}
                {invitations.length ? ` (${invitations.length})` : ''}
              </Box>
            </SplitButton.Item>
          }>
          {() => (
            <Button
              style={{ flexShrink: 0, marginLeft: 16 }}
              edge="end"
              color="primary"
              size="small"
              data-cy="invite-member"
              onClick={() => setShowInviteMember(true)}>
              <AddIcon style={{ fontSize: '1.3em', marginRight: 4 }} />
              {t('team.invite.action')}
            </Button>
          )}
        </SplitButton>
      );
    }

    if (type === 'server') {
      customButtons.push(
        <Permission role="owner">
          <Button
            style={{ flexShrink: 0, marginLeft: 16 }}
            variant="contained"
            edge="end"
            color="error"
            data-cy="invite-member"
            onClick={() => setShowTransferMember(true)}>
            <LoopIcon style={{ fontSize: '1.3em', marginRight: 4 }} />
            {t('team.transferNode.name')}
          </Button>
        </Permission>
      );
    }
  }

  const onRoleChange = (role) => {
    if (loading) {
      return;
    }

    setSearch((x) => ({ ...x, role, hideBlocked: false, searchText: '', page: 1 }));
  };

  const onHideBlockedChange = (value) => {
    setSearch((x) => ({ ...x, hideBlocked: value, page: 1 }));
  };

  const onTableChange = ({ page, rowsPerPage, searchText }) => {
    if (search.pageSize !== rowsPerPage) {
      setSearch((x) => ({ ...x, pageSize: rowsPerPage, page: 1 }));
    } else if (search.page !== page + 1) {
      setSearch((x) => ({ ...x, page: page + 1 }));
    } else if (search.searchText !== searchText) {
      setSearch((x) => ({ ...x, searchText, page: 1 }));
    }
  };

  const datatableRef = useRef(null);

  const customToolbarSelect = (_selectedRows) => {
    if (!_selectedRows.data.length) return null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <LabelPicker
          value={[labels]}
          onChange={(v) => {
            setLabels([...labels, v[0]]);

            client
              .createTagging({
                input: {
                  teamDid,
                  tagging: {
                    tagId: v[0],
                    taggableIds: selectedRows,
                    taggableType: 'user',
                  },
                },
              })
              .then(() => {
                getUsersInfo();
                setSelectedRows([]);
              });
          }}
          trigger={
            <Button
              className="resend-btn"
              color="primary"
              variant="contained"
              sx={{ my: '2px', '.MuiButton-startIcon': { mr: '2px' } }}
              onClick={() => {}}>
              {t('label.actionLabel')}
            </Button>
          }
          multiple={false}
          actions={labelManageActions}
        />
      </Box>
    );
  };

  const tableOptions = {
    sort: false,
    download: false,
    filter: false,
    print: false,
    expandableRowsOnClick: true,
    onRowClick(row, { dataIndex }, e) {
      if (datatableRef.current?.contains(e.target)) {
        const x = users[dataIndex];
        setMemberDialog(x);
      }
    },
    page: search.page - 1,
    rowsPerPage: search.pageSize,
    count: rowCount,
    searchDebounceTime: 600,

    selectableRows: 'multiple',
    filterType: 'checkbox',
    onRowSelectionChange: (_, __, rowsSelected) => {
      const ids = rowsSelected.map((idx) => users[idx].did);
      setSelectedRows(ids);
    },
    rowsSelected: users.map((row, idx) => (selectedRows.includes(row.did) ? idx : null)).filter((idx) => idx !== null),
    customToolbarSelect,
  };

  return (
    <Div>
      <Box className="main" sx={{ display: 'flex', gap: 3 }}>
        <Box className="left">
          <Box className="tabs">
            {sideList.map((x) => (
              <Box
                className={`tab ${search.role === x.name ? 'active' : ''}`}
                onClick={() => onRoleChange(x.name)}
                key={x.name}>
                <span className="text">{x.title}</span>
                <Box sx={{ color: 'text.secondary' }}>{x.num}</Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box ref={datatableRef} className="right" sx={{ '.MuiPaper-root': { flex: 0 } }}>
          <Datatable
            className="main-table"
            verticalKeyWidth={100}
            locale={locale}
            durable={durableKey}
            durableKeys={['page', 'rowsPerPage']}
            title={
              <Box className="table-toolbar-left" sx={{ pl: '12px !important' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      sx={{ display: 'flex !important' }}
                      disabled={loading}
                      color="primary"
                      checked={search.hideBlocked}
                      onChange={(e) => onHideBlockedChange(e.target.checked)}
                    />
                  }
                  label={t('team.member.onlyApprovedMember')}
                />
              </Box>
            }
            data={users}
            columns={columns}
            customButtons={customButtons}
            options={tableOptions}
            loading={loading}
            onChange={onTableChange}
          />
        </Box>
      </Box>
      <Dialog
        title={t('common.inviting')}
        onClose={() => setShowInviting(false)}
        open={showInviting}
        maxWidth="lg"
        fullWidth>
        <Invitations />
      </Dialog>
      {memberDialog && (
        <Member
          onCancel={() => setMemberDialog(null)}
          userDid={memberDialog.did}
          createPassportSvg={createPassportSvg}
          initTab={memberDialog.initTab}
          handleChangeLabels={() => getUsersInfo()}
        />
      )}
      {showInviteMember && (
        <InviteMember
          teamDid={teamDid}
          endpoint={appUrl || endpoint}
          roles={roles}
          apps={appInfoList}
          isFederated={isFederated}
          onCancel={() => setShowInviteMember(false)}
          onSuccess={() => {
            refresh();
            setShowInviteMember(false);
          }}
        />
      )}

      {showTransferMember && (
        <TransferMember
          teamDid={teamDid}
          endpoint={appUrl || endpoint}
          roles={roles}
          onCancel={() => setShowTransferMember(false)}
          onSuccess={() => {
            refresh();
            setShowTransferMember(false);
          }}
        />
      )}

      {showManageLabels && (
        <Dialog
          title={t('label.manage')}
          onClose={() => setShowManageLabels(false)}
          open={showManageLabels}
          maxWidth="lg"
          fullWidth
          PaperProps={{ style: { height: '80vh' } }}>
          <ManageLabels
            onReload={() => {
              getUsersInfo();
              refetch();
            }}
          />
        </Dialog>
      )}
      {showUserSessionParams.show && (
        <Dialog
          title={
            <div>
              {t('common.userSessions')}
              {showUserSessionParams.showAppPid ? ' (Show All)' : ''}
            </div>
          }
          onClose={() => triggerUserSessions(false)}
          open={showUserSessionParams.show}
          maxWidth="lg"
          PaperProps={{ style: { minHeight: '80vh' } }}
          fullWidth>
          <UserSessions
            showAppPid={showUserSessionParams.showAppPid}
            user={showUserSessionParams.user}
            showAction={false}
            showUser={false}
            showOffline
            getUserSessions={showUserSessionParams.getUserSessions}
          />
        </Dialog>
      )}
    </Div>
  );
}

const Div = styled.div`
  .main {
    .left {
      width: 256px;
      flex-shrink: 0;

      .tabs {
        padding-top: 16px;
        .tab {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          transition: background 0.4s;

          width: 256px;
          height: 36px;
          border-radius: 8px;

          cursor: pointer;
          user-select: none;

          &:nth-of-type(n + 2) {
            margin-top: 24px;
          }

          &.active {
            background-color: ${({ theme }) => theme.palette.grey[100]};
          }

          &:hover {
            background-color: ${({ theme }) => theme.palette.grey[100]};
          }

          .text {
            font-weight: 400;
            font-size: 16px;
            line-height: 19px;
            color: ${({ theme }) => theme.palette.text.primary};
          }

          .badge {
            display: flex;
            flex-shrink: 0;
            justify-content: center;
            align-items: center;
            width: 20px;
            height: 20px;
            border-radius: 100%;
            color: #fff;
            background: #666666;
            font-size: 10px;
            font-weight: 400;
            &.is-rect {
              width: auto;
              border-radius: 8px;
              padding: 0 4px;
            }
          }
        }
      }
      @media (max-width: ${(props) => props.theme.breakpoints.values.md}px) {
        display: none;
      }
    }
    .right {
      flex: 1;
      overflow: auto;
    }
  }

  .member-block {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    .member-avatar {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .member-meta {
      margin-left: 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
    }
    .badge-block {
      width: 14px;
      height: 14px;
      position: absolute;
      right: -4px;
      top: -4px;
      background: #ff5757;
      border-radius: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      &::after {
        content: '';
        width: 6px;
        height: 2px;
        background: #fefefe;
      }
    }
    .badge-owner {
      position: absolute;
      right: -6px;
      top: -8px;
      display: flex;
      align-items: center;
      justify-content: center;
      &::after {
        content: '👑';
      }
    }
  }

  .table-toolbar-left {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 7px 0;
  }
`;

MemberList.propTypes = {
  type: PropTypes.oneOf(['server', 'blocklet']).isRequired,
  createPassportSvg: PropTypes.func.isRequired,
};

function Members({ type, createPassportSvg }) {
  return (
    <LabelsProvider>
      <MembersLabelsProvider>
        <MemberList {...{ type, createPassportSvg }} />
      </MembersLabelsProvider>
    </LabelsProvider>
  );
}

Members.propTypes = {
  ...MemberList.propTypes,
};

export default Members;
