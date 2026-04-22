/* eslint-disable prettier/prettier */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import get from 'lodash/get';
import Toast from '@arcblock/ux/lib/Toast';

import AddIcon from '@mui/icons-material/Add';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTheme, Box, Tooltip, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useReactive } from 'ahooks';

import { getWalletDid } from '@blocklet/meta/lib/did-utils';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import RevokeIcon from '@arcblock/icons/lib/RevokeIcon';
import ExternalIssuerIcon from '@arcblock/icons/lib/ExternalIssuerIcon';
import Empty from '@arcblock/ux/lib/Empty';

import { PASSPORT_STATUS } from '@abtnode/constant';

import { useNodeContext } from '../../contexts/node';
import { useSessionContext } from '../../contexts/session';
import { useTeamContext } from '../../contexts/team';
import { useBlockletContext } from '../../contexts/blocklet';
import { formatError, BlockletAdminRoles } from '../../util';
import Confirm from '../../confirm';
import Permission from '../../permission';
import SearchInput from '../search-input';
import ListHeader from '../styles/list-header';
import IssuePassport from './issue-passport';
import PassportItem from './passport-item';

function ConfirmDescription({ action, passport }) {
  const { t } = useLocaleContext();
  const { roles } = useTeamContext();
  const role = roles.find((x) => x.name === passport.role);
  return (
    <div>
      <div>
        {action === 'enable' ? t('team.member.enablePassportDescription') : t('team.member.revokePassportDescription')}
      </div>
      {role && (
        <Box
          sx={{
            mt: 3,
            fontWeight: 'bold',
          }}>
          {t('team.member.passportPermissionTitle')}
        </Box>
      )}
      {role && (
        <Box
          sx={{
            mt: 1,
          }}>
          {role.description}
        </Box>
      )}
    </div>
  );
}
ConfirmDescription.propTypes = {
  action: PropTypes.string.isRequired,
  passport: PropTypes.object.isRequired,
};

export default function Passports({ user, onCreate = () => {}, createPassportSvg }) {
  const currentState = useReactive({
    scope: 'passport',
  });
  const theme = useTheme();
  const { t } = useLocaleContext();
  const { session } = useSessionContext();
  const {
    roles,
    teamDid,
    teamIssuerDid,
    refresh: refreshTeam,
    enablePassportIssuance,
    trustedPassports,
    passportColor,
    blocklet,
  } = useTeamContext();
  const { appIdList: idList } = useBlockletContext();
  const { api, inService, info: nodeInfo } = useNodeContext();
  const [loading, setLoading] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState(null);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [search, setSearch] = useState('');

  const appIdList = [teamIssuerDid, ...(idList || [])].filter(Boolean);

  const passports = (get(user, 'passports') || []).map((x) => ({
    ...x,
    revoked: x.status === PASSPORT_STATUS.REVOKED,
  }));

  const togglePassportStatus = async (passport) => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      const method = passport.status === PASSPORT_STATUS.REVOKED ? 'enableUserPassport' : 'revokeUserPassport';
      await api[method]({ input: { teamDid, userDid: user.did, passportId: passport.id } });
      refreshTeam();
    } catch (err) {
      Toast.error(formatError(err));
    } finally {
      setLoading(false);
      setToggleConfirm(null);
    }
  };

  const confirmToggle = (item) =>
    item.status === PASSPORT_STATUS.REVOKED
      ? setToggleConfirm({
          title: t('team.member.enablePassport'),
          description: <ConfirmDescription action="enable" passport={item} />,
          confirm: t('common.enable'),
          cancel: t('common.cancel'),
          onConfirm: () => {
            togglePassportStatus(item);
          },
          onCancel: () => {
            setLoading(false);
            setToggleConfirm(null);
          },
          color: 'primary',
        })
      : setToggleConfirm({
          title: t('team.member.revokePassport'),
          description: <ConfirmDescription action="revoke" passport={item} />,
          confirm: t('common.revoke'),
          cancel: t('common.cancel'),
          onConfirm: () => {
            togglePassportStatus(item);
          },
          onCancel: () => {
            setLoading(false);
            setToggleConfirm(null);
          },
        });

  const revokeInfo = (hasPermission, passport) => {
    if (user.did === session.user.did && session.user.passportId && session.user.passportId === passport.id) {
      return {
        revokable: false,
        message: t('team.passport.shouldNotDeleteCurrent'),
      };
    }

    if (!hasPermission) {
      return {
        revokable: false,
        message: t('team.passport.noPermission'),
      };
    }

    const isBlockletOwner = user.did === blocklet?.settings?.owner?.did;
    const isNodeOwner = user.did === nodeInfo?.nodeOwner?.did;

    if ((isBlockletOwner || isNodeOwner) && passport.name === 'owner') {
      return {
        revokable: false,
        message: t('team.passport.noPermission'),
      };
    }

    return {
      revokable: true,
    };
  };

  const filteredPassports = passports
    .filter((x) => {
      if (currentState.scope) {
        return x.scope === currentState.scope;
      }
      return true;
    })
    .filter((x) => !search || x.title.includes(search) || x.name.includes(search));

  const renderAction = (can, x) => {
    if (x.status === PASSPORT_STATUS.EXPIRED) {
      return (
        <Button variant="outlined" disabled>
          {t('common.expired')}
        </Button>
      );
    }

    if (revokeInfo(can, x).revokable) {
      return (
        <Button variant="outlined" color={x.revoked ? 'primary' : 'secondary'} onClick={() => confirmToggle(x)}>
          {x.revoked ? (
            <AddIcon style={{ fontSize: 16, marginRight: 4 }} />
          ) : (
            <RevokeIcon style={{ height: 16, marginRight: 4 }} />
          )}
          {x.revoked ? t('common.enable') : t('common.revoke')}
        </Button>
      );
    }

    return (
      <Tooltip title={revokeInfo(can, x).message}>
        <ErrorOutlineIcon style={{ color: theme.palette.grey[600] }} />
      </Tooltip>
    );
  };

  const scopeList = [
    {
      label: 'All',
      value: '',
    },
    {
      label: 'passport',
      value: 'passport',
    },
    {
      label: 'kyc',
      value: 'kyc',
    },
  ];

  return (
    <Div>
      <ListHeader>
        <div className="left">
          <SearchInput
            placeholder={t('team.passport.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="right">
          {enablePassportIssuance && !!user.approved && (
            <Permission permission={inService ? '' : 'mutate_team'} role={inService ? BlockletAdminRoles : []}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                data-cy="issue-passport"
                onClick={() => setShowIssueDialog(true)}>
                <AddIcon style={{ fontSize: 16, marginRight: 4 }} />
                {t('team.passport.issue')}
              </Button>
            </Permission>
          )}
        </div>
      </ListHeader>
      <Box sx={{ mt: 3 }}>
        <RadioGroup row>
          {scopeList.map((x) => (
            <FormControlLabel
              value={x.value}
              control={
                <Radio
                  onChange={() => {
                    currentState.scope = x.value;
                  }}
                  checked={currentState.scope === x.value}
                  size="small"
                />
              }
              label={x.label}
            />
          ))}
        </RadioGroup>
        {filteredPassports.map((x) => (
          <Permission key={x.id} permission={inService ? '' : 'mutate_team'} role={inService ? BlockletAdminRoles : []}>
            {(can) => (
              <Box
                className="passport-item"
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <PassportItem
                  passport={x}
                  user={user}
                  color={passportColor}
                  createPassportSvg={createPassportSvg}
                  icon={!!appIdList.length && !appIdList.includes(x.issuer.id) ? <ExternalIssuerIcon /> : null}>
                  {!!appIdList.length && !appIdList.includes(x.issuer.id) && (
                    <div className="tip">
                      {x.issuer.id !== teamIssuerDid && !trustedPassports.some((y) => y.issuerDid === x.issuer.id) && (
                        <Tooltip title={t('team.passport.notTrustedIssuerTip')}>
                          <Box
                            component={ErrorOutlineIcon}
                            style={{ fontSize: '1.3em' }}
                            sx={{
                              color: 'error.main',
                              mr: 0.5,
                            }}
                          />
                        </Tooltip>
                      )}
                      <span>{t('team.passport.issueBy', { name: x.issuer.name })}</span>
                    </div>
                  )}
                </PassportItem>
                <Box>{renderAction(can, x)}</Box>
              </Box>
            )}
          </Permission>
        ))}
        {!filteredPassports.length && <Empty>{t('common.empty')}</Empty>}
      </Box>
      {showIssueDialog && (
        <IssuePassport
          teamDid={teamDid}
          ownerDid={user.did}
          needReceive={getWalletDid(user) === user.did}
          roles={roles}
          onCancel={() => setShowIssueDialog(false)}
          onSuccess={() => {
            onCreate();
            setShowIssueDialog(false);
          }}
          showOwnerPassport={blocklet && !blocklet.settings?.owner}
        />
      )}
      {toggleConfirm && (
        <Confirm
          title={toggleConfirm.title}
          description={toggleConfirm.description}
          confirm={toggleConfirm.confirm}
          cancel={toggleConfirm.cancel}
          params={toggleConfirm.params}
          onConfirm={toggleConfirm.onConfirm}
          onCancel={toggleConfirm.onCancel}
          color={toggleConfirm.color}
        />
      )}
    </Div>
  );
}

Passports.propTypes = {
  user: PropTypes.object.isRequired,
  createPassportSvg: PropTypes.func.isRequired,
  onCreate: PropTypes.func,
};

const Div = styled.div`
  .passport-item {
    .MuiButton-outlinedSecondary {
      color: #f16e6e;
      fill: #f16e6e;
      background: #fcf3f3;
      border: 0;
      &:hover {
        border: 0;
      }
    }
  }
`;
