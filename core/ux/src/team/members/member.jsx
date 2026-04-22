/* eslint-disable react/no-unstable-nested-components */
import { useEffect, useState, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Toast from '@arcblock/ux/lib/Toast';

import Dialog from '@arcblock/ux/lib/Dialog';
import Spinner from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tabs from '@arcblock/ux/lib/Tabs';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import VerifiedIcon from '@mui/icons-material/Verified';
import RemoveIcon from '@mui/icons-material/DeleteOutline';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType, InfoType } from '@arcblock/ux/lib/UserCard/types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import BlockAccessIcon from '@arcblock/icons/lib/ForbidLoginIcon';
import AllowAccessIcon from '@arcblock/icons/lib/AllowLoginIcon';
import { useCreation, useReactive } from 'ahooks';
import { Icon } from '@iconify/react';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { USER_TYPE } from '@abtnode/constant';
import { TeamEvents } from '@blocklet/constant';
import { LOGIN_PROVIDER_NAME } from '@arcblock/ux/lib/Util/constant';

import { Button, Tooltip } from '@mui/material';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import LabelPicker from '../../blocklet/labels/picker/label';
import LabelChip from '../../blocklet/labels/chip';
import DidAddress from '../../did-address';
import Permission from '../../permission';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import { formatError, BlockletAdminRoles } from '../../util';
import PassportIssuances from './passport-issuances';
import Passports from './passports';
import ToggleAccess from './toggle-access';
import RemoveUser from './remove-user';
import { parseAvatar } from './util';
import blockletSdk from '../../util/sdk';
import UserConnections from './connections';
import { useSessionContext } from '../../contexts/session';
import UserFollowers from '../user-follower';
import { useMembersLabels } from './label-provider';
import FederatedDetailDialog from '../../blocklet/authentication/federated/federated-detail-dialog';

// eslint-disable-next-line react/prop-types
function VerifiedInfo({ info, verified }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {info}
      {verified && <VerifiedIcon color="success" style={{ fontSize: 16, marginLeft: 4 }} />}
    </Box>
  );
}

function LinkUser({ name, ...rest }) {
  return (
    <Box {...rest} sx={{ color: 'primary.main', '&:hover': { textDecoration: 'underline' }, cursor: 'pointer' }}>
      {name}
    </Box>
  );
}

LinkUser.propTypes = {
  name: PropTypes.string.isRequired,
};

const defaultTab = 'info';

export default function Member({
  userDid,
  onCancel,
  initTab = defaultTab,
  createPassportSvg,
  handleChangeLabels = () => {},
}) {
  const {
    api,
    ws: { useSubscription },
    inService,
    info: nodeInfo,
  } = useNodeContext();
  const { session } = useSessionContext();
  const { roles, teamDid, isNodeTeam, enablePassportIssuance, blocklet } = useTeamContext();
  const { t, locale } = useLocaleContext();
  const pageState = useReactive({ user: null, issuances: null, tab: initTab || defaultTab });
  const [profileUrl, setProfileUrl] = useState('');
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const { labelManageActions } = useMembersLabels();
  const federatedDetailDialogRef = useRef(null);

  const isServerMember = useMemo(() => teamDid === nodeInfo.did, [teamDid, nodeInfo.did]);

  const getData = async (_teamDid, _userDid) => {
    try {
      const res = await api.doBatchQuery({
        getUser: { input: { teamDid: _teamDid, user: { did: _userDid }, options: { includeTags: true } } },
        getPassportIssuances: { input: { teamDid: _teamDid, ownerDid: _userDid } },
      });

      if (res.getUser.user) {
        res.getUser.user.avatar = parseAvatar(res.getUser.user.avatar, _teamDid, inService);

        // for backwards compatibility
        res.getUser.user.passports = (res.getUser.user.passports || []).filter((x) => x.issuer);
      }

      pageState.user = res.getUser.user || {};
      setLabels((pageState.user?.tags || []).map((x) => x.id));
      pageState.issuances = res.getPassportIssuances.list || [];
    } catch (err) {
      Toast.error(formatError(err));
    }
  };

  useEffect(() => {
    if (teamDid) {
      getData(teamDid, userDid);
    }
  }, [userDid, teamDid]); // eslint-disable-line

  const onUserEvent = (data) => {
    if (data.teamDid === teamDid && data.user && data.user.did === userDid) {
      getData(teamDid, userDid);
    }
  };

  useSubscription(TeamEvents.userUpdated, onUserEvent, [userDid, teamDid]);

  useEffect(() => {
    if (pageState.issuances && !pageState.issuances.length && pageState.tab === 'issuances') {
      pageState.tab = defaultTab;
    }
  }, [pageState.issuances]); // eslint-disable-line

  useEffect(() => {
    blockletSdk.user.getProfileUrl({ did: pageState.user?.did, locale }).then(setProfileUrl);
  }, [pageState.user?.did, locale]);

  const handleChangeUser = async (changedUser) => {
    await getData(teamDid, changedUser.did);
    pageState.tab = pageState.tab || defaultTab;
  };

  const bodyStyle = useMemo(() => {
    if (pageState.tab === 'userFollowers') {
      return {
        marginTop: 0,
      };
    }
    return {};
  }, [pageState.tab]);

  const createdByApp = useCreation(() => {
    if (isServerMember) return null;

    const sites = blocklet?.settings?.federated?.sites || [];
    return sites.find((x) => x.appPid === pageState.user?.createdByAppPid);
  }, [pageState.user?.createdByAppPid, blocklet]);

  // tab
  const Info = () => {
    const rows = pageState.user
      ? [
          isServerMember ? false : { name: t('team.member.name'), value: pageState.user.name },
          { name: t('team.member.fullName'), value: pageState.user.fullName },
          {
            name: t('common.email'),
            value: pageState.user.email ? (
              <VerifiedInfo info={pageState.user.email} verified={pageState.user.emailVerified} />
            ) : (
              '-'
            ),
          },
          {
            name: t('common.phone'),
            value: pageState.user.phone ? (
              <VerifiedInfo info={pageState.user.phone} verified={pageState.user.phoneVerified} />
            ) : (
              '-'
            ),
          },
          {
            name: t('team.member.source'),
            value: (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {LOGIN_PROVIDER_NAME[pageState.user?.sourceProvider || USER_TYPE.WALLET] ||
                  pageState.user?.sourceProvider}
              </Box>
            ),
          },
          isServerMember
            ? false
            : {
                name: t('team.member.createdByApp'),
                value: pageState.user.createdByAppPid ? (
                  <DidAddress
                    compact
                    responsive={false}
                    did={pageState.user.createdByAppPid}
                    append={
                      createdByApp ? (
                        <Tooltip title={t('federated.viewSiteDetail')}>
                          <IconButton
                            sx={{ ml: 0.5 }}
                            size="small"
                            aria-label="view detail"
                            onClick={() => {
                              federatedDetailDialogRef.current?.open(createdByApp);
                            }}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      ) : null
                    }
                  />
                ) : (
                  '-'
                ),
              },
          { name: t('team.member.allowAccess'), value: pageState.user.approved ? t('common.yes') : t('common.no') },
          {
            name: t('common.createdAt'),
            value: pageState.user.createdAt ? (
              <RelativeTime value={pageState.user.createdAt} type="all" locale={locale} />
            ) : (
              '-'
            ),
          },
          {
            name: t('team.member.lastLogin'),
            value: pageState.user.lastLoginAt ? (
              <RelativeTime value={pageState.user.lastLoginAt} type="all" locale={locale} />
            ) : (
              '-'
            ),
          },
          { name: t('team.member.lastLoginIp'), value: pageState.user.lastLoginIp || '' },
          { name: t('common.remark'), value: pageState.user.remark || '-' },
          {
            name: t('team.invite.inviter'),
            value: pageState.user.inviter ? (
              <DidAddress compact responsive did={pageState.user.inviter} showQrcode />
            ) : (
              '-'
            ),
          },
          {
            name: t('label.title'),
            value: (
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                <>
                  {pageState.user.tags.map((x) => (
                    <LabelChip
                      key={x.id}
                      label={x}
                      onDelete={() => {
                        api
                          .deleteTagging({
                            input: {
                              teamDid,
                              tagging: { tagId: x.id, taggableIds: [pageState.user.did], taggableType: 'user' },
                            },
                          })
                          .then(() => {
                            getData(teamDid, userDid);
                            handleChangeLabels();
                          });
                      }}
                    />
                  ))}
                </>

                {loading && <Spinner size={14} />}

                <LabelPicker
                  value={[labels]}
                  onChange={(v) => {
                    setLabels(v);
                    setLoading(true);

                    api
                      .createTagging({
                        input: {
                          teamDid,
                          tagging: {
                            tagId: v[0],
                            taggableIds: [pageState.user.did],
                            taggableType: 'user',
                          },
                        },
                      })
                      .then(() => {
                        setTimeout(() => {
                          getData(teamDid, userDid);
                          handleChangeLabels();
                          setLoading(false);
                        }, 1000);
                      });
                  }}
                  trigger={
                    <IconButton color="inherit" variant="outlined">
                      <LocalOfferOutlinedIcon style={{ fontSize: 14 }} />
                    </IconButton>
                  }
                  multiple={false}
                  excludes={labels}
                  actions={labelManageActions}
                />
              </Box>
            ),
          },
        ].filter(Boolean)
      : [];

    return rows.map((row) => {
      if (row.name === t('common.did')) {
        return (
          <InfoRow
            valueComponent="div"
            key={row.name}
            nameWidth={120}
            name={row.name}
            nameFormatter={() => t('common.did')}>
            {row.value}
          </InfoRow>
        );
      }

      return (
        <InfoRow
          style={{ alignItems: 'flex-start' }}
          valueComponent="div"
          key={row.name}
          nameWidth={120}
          name={row.name}>
          {row.value}
        </InfoRow>
      );
    });
  };

  const tabConfigs = {
    info: {
      label: t('common.basicInfo'),
      value: defaultTab,
      component: Info,
    },
    oauth: {
      label: t('team.member.connectedAccounts'),
      value: 'oauth',
      component: () => <UserConnections user={pageState.user} onChangeUser={handleChangeUser} />,
    },
    passports: {
      label: t('common.passport'),
      value: 'passports',
      component: () => (
        <Passports
          user={pageState.user}
          teamDid={teamDid}
          roles={roles}
          createPassportSvg={createPassportSvg}
          onCreate={() => {
            getData(teamDid, userDid).then(() => {
              // oauth 账户邀请后，不会产生待领取的邀请链接
              // 当没有邀请链接的情况下，当前 tab 激活应当保持现状不变
              if (enablePassportIssuance && pageState.issuances && !!pageState.issuances.length) {
                pageState.tab = 'issuances';
              }
            });
          }}
          onRefresh={() => {
            getData(teamDid, userDid);
          }}
        />
      ),
    },
    issuances: {
      label: t('team.passport.issuance.pending'),
      value: 'issuances',
      component: () => (
        <PassportIssuances
          issuances={pageState.issuances || []}
          teamDid={teamDid}
          onRefresh={() => getData(teamDid, userDid)}
        />
      ),
    },
    userFollowers: {
      label: t('team.userFollowers.title'),
      value: 'userFollowers',
      component: () => (
        <Box className="user-followers-container" sx={{ p: 1 }}>
          <UserFollowers column={1} user={pageState.user} teamDid={teamDid} showSocialActions={false} />
        </Box>
      ),
    },
  };

  // 在 Server 端不存在用户之间的 follow 关系，所以不需要显示 userFollowers 标签页
  if (isServerMember && Object.prototype.hasOwnProperty.call(tabConfigs, 'userFollowers')) {
    delete tabConfigs.userFollowers;
  }

  const tabs = Object.values(tabConfigs)
    .map(({ label, value }) => ({ label, value }))
    .filter((x) => {
      if (x.value === 'issuances') {
        return enablePassportIssuance && pageState.issuances && !!pageState.issuances.length;
      }
      if (x.value === 'oauth') {
        // always show oauth tab for current server users to allow them to manage passkeys
        if (isNodeTeam && session.user?.did === userDid) {
          return true;
        }

        const connectedAccounts = pageState.user?.connectedAccounts || [];
        return connectedAccounts.find((a) => a.did !== pageState.user?.did);
      }

      return true;
    });

  const tabConfig = tabConfigs[pageState.tab] || tabConfigs.info;
  const onTabChange = (newTab) => {
    pageState.tab = newTab;
  };

  return (
    <Dialog
      title={t('common.member')}
      onClose={onCancel}
      open
      PaperProps={{ style: { maxWidth: 632, minHeight: '80vh' } }}
      fullWidth
      actions={
        pageState.user && (
          <Permission permission={inService ? '' : 'mutate_team'} role={inService ? BlockletAdminRoles : []}>
            <ToggleAccess user={pageState.user}>
              {({ open }) => (
                <BlockButton onClick={open}>
                  {pageState.user.approved ? (
                    <BlockAccessIcon style={{ fontSize: '1.2em', marginRight: '0.4em' }} />
                  ) : (
                    <AllowAccessIcon style={{ fontSize: '1.2em', marginRight: '0.4em' }} />
                  )}
                  {pageState.user.approved ? t('team.member.blockAccess') : t('team.member.allowAccess')}
                </BlockButton>
              )}
            </ToggleAccess>
            <RemoveUser user={pageState.user} onSuccess={onCancel}>
              {({ open }) => (
                <BlockButton onClick={open}>
                  <RemoveIcon style={{ fontSize: '1.2em', marginRight: '0.4em' }} />
                  {t('team.member.removeUser')}
                </BlockButton>
              )}
            </RemoveUser>
          </Permission>
        )
      }>
      <Div>
        {!pageState.user && (
          <Center>
            <Spinner />
          </Center>
        )}
        {pageState.user && (
          <Box>
            {/* info */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                overflow: 'hidden',
                gap: 1,
                flexWrap: 'wrap',
              }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: 300,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
                className="info">
                <UserCard
                  user={pageState.user}
                  cardType={CardType.Detailed}
                  infoType={InfoType.Minimal}
                  avatarSize={48}
                  sx={{
                    padding: 0,
                    border: 'none',
                  }}
                  showDid
                  didProps={{ compact: true, responsive: false, showQrcode: true }}
                />
              </Box>
              {!!inService && (
                <Box href={profileUrl} target="_blank" rel="noreferrer" component="a">
                  <Button variant="contained" color="primary" data-cy="issue-passport">
                    <Icon icon="majesticons:open-line" style={{ fontSize: 16, marginRight: 4 }} />
                    {t('team.member.openProfile')}
                  </Button>
                </Box>
              )}
            </Box>

            {/* tabs */}
            <Box className="tabs" sx={{ mx: 3 }}>
              <Tabs tabs={tabs} current={pageState.tab} onChange={onTabChange} scrollButtons="auto" />
            </Box>

            {/* body */}
            <Box className="body" style={bodyStyle}>
              <tabConfig.component />
            </Box>
          </Box>
        )}
      </Div>
      <FederatedDetailDialog ref={federatedDetailDialogRef} />
    </Dialog>
  );
}

Member.propTypes = {
  userDid: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  createPassportSvg: PropTypes.func.isRequired,
  initTab: PropTypes.string,
  handleChangeLabels: PropTypes.func,
};

const Div = styled.div`
  .info {
    .name {
      font-weight: 400;
      font-size: 18px;
      line-height: 25px;
      color: ${({ theme }) => theme.palette.text.primary};
    }
  }

  .tabs {
    margin-top: 24px;
    margin-left: 0;
    margin-right: 0;
  }

  .body {
    margin-top: 24px;
  }
`;

const Center = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const BlockButton = styled.div`
  flex-shrink: 0;
  width: 50%;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  position: sticky;
  bottom: 0;
  z-index: 10;
  color: #999;
  fill: #999;
`;
