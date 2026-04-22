/* eslint-disable react/no-unstable-nested-components */
import { useContext, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import Empty from '@arcblock/ux/lib/Empty';
import Datatable from '@arcblock/ux/lib/Datatable';
import Box from '@mui/material/Box';
import dayjs from '@abtnode/util/lib/dayjs';
import styled from '@emotion/styled';
import { Tooltip } from '@mui/material';
import noop from 'lodash/noop';

import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import Confirm from '../../confirm';
import Permission from '../../permission';
import ClickToCopy from '../../click-to-copy';
import { sleep, getInviteLink, BlockletAdminRoles } from '../../util';

export default function Invitations({ invitations = [], onRefresh = noop }) {
  const { api: client, inService } = useNodeContext();
  const { t, locale } = useContext(LocaleContext);
  const { teamDid, invitations: teamInvitations, refresh, endpoint, roles } = useTeamContext();
  const [delConfirm, setDelConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  const displayInvitations = useMemo(() => {
    return invitations.length > 0 ? invitations : teamInvitations;
  }, [invitations, teamInvitations]);

  const deleteInvitation = async ({ inviteId }) => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      await client.deleteInvitation({ input: { teamDid, inviteId } });
      refresh();
      onRefresh?.();
      await sleep(800);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setDelConfirm(null);
    }
  };

  const onCancel = () => {
    setLoading(false);
    setDelConfirm(null);
  };

  const getLink = (column) => {
    if (!endpoint) {
      return '';
    }
    return getInviteLink({ inviteId: column.inviteId, endpoint });
  };

  const columns = [
    {
      label: t('team.inviting.link'),
      name: 'inviteId',
      options: {
        sort: false,
        customBodyRenderLite: (rawIndex) => {
          const d = displayInvitations[rawIndex];
          if (!endpoint) {
            return <CircularProgress size={16} />;
          }
          return <ClickToCopy>{getLink(d)}</ClickToCopy>;
        },
      },
    },
    {
      label: t('common.role'),
      name: 'role',
      widtn: 70,
      options: {
        sort: false,
        customBodyRender: (role) => {
          const findRole = roles.find((r) => r.name === role);
          if (findRole?.title) {
            return <Tooltip title={role}>{findRole.title}</Tooltip>;
          }
          return role || '--';
        },
      },
    },
    {
      label: t('common.remark'),
      name: 'remark',
      options: {
        sort: false,
        customBodyRender: (e) => {
          return e || '--';
        },
      },
    },
    {
      label: t('team.inviting.inviter'),
      name: 'inviter.fullName',
      options: {
        sort: false,
        customBodyRender: (e, { rowIndex }) => {
          const d = displayInvitations[rowIndex];

          return d?.inviter?.fullName;
        },
      },
    },
    {
      label: t('common.expires'),
      name: 'expireDate',
      options: {
        sort: false,
        customBodyRender: (e) => {
          return <Box>{dayjs(e).format('YYYY-MM-DD HH:mm')}</Box>;
        },
      },
    },
    {
      label: t('common.actions'),
      name: '',
      width: 100,
      align: 'center',
      options: {
        sort: false,
        customBodyRenderLite: (rawIndex) => {
          const item = displayInvitations[rawIndex];

          return (
            <Permission permission={inService ? '' : 'mutate_team'} role={inService ? BlockletAdminRoles : []}>
              <Button
                onClick={() =>
                  setDelConfirm({
                    title: t('team.inviting.delete.title'),
                    description: t('team.inviting.delete.description', { link: getLink(item) }),
                    confirm: t('common.delConfirm'),
                    cancel: t('common.cancel'),
                    onConfirm: () => deleteInvitation(item),
                    onCancel,
                  })
                }
                size="small"
                color="error"
                variant="text">
                <DeleteIcon style={{ fontSize: '1.2em' }} />
                {t('common.delete')}
              </Button>
            </Permission>
          );
        },
      },
    },
  ];

  return (
    <Div>
      {displayInvitations.length ? (
        <Datatable
          locale={locale}
          data={[...displayInvitations]}
          columns={columns}
          verticalKeyWidth={100}
          options={{
            download: false,
            filter: false,
            print: false,
            search: false,
            viewColumns: false,
          }}
        />
      ) : (
        <Empty sx={{ minHeight: 200 }}>{t('common.empty')}</Empty>
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
    </Div>
  );
}

Invitations.propTypes = {
  invitations: PropTypes.array,
  onRefresh: PropTypes.func,
};

const Div = styled.div`
  margin-top: -20px;
`;
