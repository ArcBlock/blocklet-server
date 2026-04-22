import React, { useState, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import { ROLES } from '@abtnode/constant';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Typography from '@arcblock/ux/lib/Typography';
import EditIcon from '@arcblock/icons/lib/EditIcon';
import LockIcon from '@arcblock/icons/lib/LockIcon';
import AddIcon from '@mui/icons-material/Add';

import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import trim from 'lodash/trim';
import { CopyButton } from '@arcblock/ux/lib/ClickToCopy';
import MutateRole from './mutate-role';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import { isProtectedRole, BlockletAdminRoles } from '../../util';
import Permission from '../../permission';
import Detail from './detail';

// eslint-disable-next-line react/prop-types
const FieldDisplay = memo(({ field, value, copyable }) => {
  const { local } = useLocaleContext();
  if (!value) return null;
  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
      {field ? (
        <Typography variant="subtitle1" color="textSecondary" sx={{ width: 50, textAlign: 'right' }}>
          {field}:
        </Typography>
      ) : null}
      <Typography variant="body1">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}>
          <Tooltip title={value}>
            <span className="value-ellipsis">{value}</span>
          </Tooltip>
          {copyable ? (
            <CopyButton
              content={trim(value)}
              locale={local}
              style={{ marginLeft: '4px', color: '#999', fontSize: '0.8em', verticalAlign: 'bottom' }}
            />
          ) : null}
        </Box>
      </Typography>
    </Box>
  );
});

// eslint-disable-next-line react/prop-types
const PassportItem = memo(({ role = {}, createPassportSvg, onUpdate, passportProps = {}, actions = null }) => {
  const { inService } = useNodeContext();

  const isMobile = useMediaQuery((x) => x.breakpoints.down('md'));

  const isNotCustomRole = useMemo(() => {
    return role.name && !ROLES[role.name.toUpperCase()];
  }, [role]);

  return (
    <Box
      data-cy={`passport-${role.name}`}
      className="item"
      onClick={() => onUpdate(role)}
      key={role.name}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}>
        <div
          style={{ width: 150 }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: createPassportSvg({
              title: role.title,
              ownerName: 'Your Name',
              width: '150px',
              ...passportProps,
            }),
          }}
        />
        <Box
          className="title"
          sx={{
            ml: 3,
          }}>
          <FieldDisplay value={role.title} />
          {isNotCustomRole ? <FieldDisplay value={role.name} copyable /> : null}
        </Box>
      </Box>
      {!isMobile && <Box className="description">{role.description}</Box>}
      {actions || (
        <Permission permission={inService ? '' : 'mutate_team'} role={inService ? BlockletAdminRoles : []}>
          <div className="action">{isProtectedRole(role.name) ? <LockIcon /> : <EditIcon />}</div>
        </Permission>
      )}
    </Box>
  );
});

export default function PassportList({ createPassportSvg }) {
  const { roles, teamIssuerDid, teamName, refresh: refreshTeam, passportColor, teamDid, isNodeTeam } = useTeamContext();
  const { t } = useLocaleContext();
  const [showCreate, setShowCreate] = useState(false);

  const [updateForm, setUpdateForm] = useState(false);

  return (
    <Div sx={{ mt: 0 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
        {!isNodeTeam && (
          <Button
            variant="contained"
            edge="end"
            color="primary"
            data-cy="create-role"
            onClick={() => setShowCreate(true)}>
            <AddIcon style={{ fontSize: 16, marginRight: 4 }} />
            {t('team.passport.create.title')}
          </Button>
        )}
      </Box>
      <Box className="list">
        {roles.map((role) => (
          <PassportItem
            role={role}
            createPassportSvg={createPassportSvg}
            onUpdate={setUpdateForm}
            passportProps={{
              issuer: teamName,
              issuerDid: teamIssuerDid,
              ownerDid: teamIssuerDid,
              preferredColor: passportColor,
            }}
          />
        ))}
      </Box>
      {updateForm && (
        <Detail
          onCancel={() => setUpdateForm(false)}
          onSuccess={() => {
            setUpdateForm(false);
            refreshTeam();
          }}
          onDelete={() => {
            setUpdateForm(false);
            refreshTeam();
          }}
          mode="update"
          roleName={updateForm.name}
          item={updateForm}
        />
      )}
      {showCreate && (
        <MutateRole
          teamDid={teamDid}
          onCancel={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            refreshTeam();
          }}
        />
      )}
    </Div>
  );
}

export { FieldDisplay, PassportItem };

export const Div = styled(Box)`
  .list {
    .item {
      padding: 12px;
      margin: 12px -12px;
      cursor: pointer;
      transition: box-shadow 0.4s;
      &:hover {
        box-shadow: 0 0 10px 4px rgba(0, 0, 0, 0.1);
      }

      .value-ellipsis {
        display: inline-block;
        max-width: 290px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .title {
      font-weight: 400;
      font-size: 18px;
      line-height: 21px;
      color: ${({ theme }) => theme.palette.text.primary};
    }

    .description {
      flex: 1;
      margin-left: 24px;
      margin-right: 24px;
      color: ${({ theme }) => theme.palette.text.secondary};
    }

    .action {
      fill: ${({ theme }) => theme.palette.text.secondary};
    }
  }
`;

PassportList.propTypes = {
  createPassportSvg: PropTypes.func.isRequired,
};
