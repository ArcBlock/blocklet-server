import React, { useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { useRequest } from 'ahooks';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Datatable, { getDurableData } from '@arcblock/ux/lib/Datatable';
import Toast from '@arcblock/ux/lib/Toast';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs from '@abtnode/util/lib/dayjs';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { PASSPORT_STATUS } from '@abtnode/constant';
import PassportDetail from './detail';
import { useTeamContext } from '../../../contexts/team';
import { useNodeContext } from '../../../contexts/node';
import Role from './role';
import {
  useSystemRoles,
  renderDid,
  renderRole,
  renderStatus,
  renderTime,
  renderSource,
  renderUser,
} from './passport-item';
import { parseAvatar } from '../../members/util';

const ROLE_ALL = '$all';
const STATUS_ALL = '';

const PassportImage = React.memo(({ createPassportSvg, passport, teamDid, inService }) => {
  return (
    <Box
      sx={{ display: 'flex' }}
      dangerouslySetInnerHTML={{
        __html: createPassportSvg({
          scope: passport.scope,
          role: passport.role,
          title: passport.scope === 'kyc' ? passport.name : passport.title,
          issuer: passport.issuer && passport.issuer.name,
          issuerDid: passport.issuer && passport.issuer.id,
          ownerName: passport.user?.fullName,
          ownerDid: passport.user?.did,
          ownerAvatarUrl: passport.user?.avatar ? parseAvatar(passport.user?.avatar, teamDid, inService) : '',
          revoked: passport.revoked,
          width: '36px',
          extra: passport?.expirationDate
            ? {
                key: 'Exp',
                value: dayjs(passport.expirationDate).format('YYYY-MM-DD HH:mm:ss'),
              }
            : null,
        }),
      }}
    />
  );
});

PassportImage.propTypes = {
  passport: PropTypes.object.isRequired,
  createPassportSvg: PropTypes.func.isRequired,
  teamDid: PropTypes.string.isRequired,
  inService: PropTypes.bool.isRequired,
};

export default function PassportList({ createPassportSvg }) {
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();
  const { t, locale } = useLocaleContext();
  const { SYSTEM_ROLES } = useSystemRoles();
  const { inService } = useNodeContext();

  const [passport, setPassportDialog] = useState(false);

  const durableKey = `passports-${teamDid}`;
  const tableDurableData = getDurableData(durableKey);

  const [search, setSearch] = useState({
    role: ROLE_ALL,
    status: STATUS_ALL,
    searchText: tableDurableData.searchText || '',
    pageSize: tableDurableData.rowsPerPage || 10,
    page: tableDurableData.page ? tableDurableData.page + 1 : 1,
  });

  const { data: countData, loading: countLoading } = useRequest(
    async () => {
      const response = await api.getPassportRoleCounts({ input: { teamDid } });
      return response.counts || [];
    },
    {
      refreshDeps: [teamDid],
    }
  );

  const { data: passportData, loading: passportLoading } = useRequest(
    async () => {
      const query = {};
      if (search.role !== ROLE_ALL) {
        query.role = search.role;
      }

      if (search.status) {
        query.status = search.status;
      }

      const response = await api.getPassportsByRole({
        input: {
          teamDid,
          query,
          paging: {
            page: search.page,
            pageSize: search.pageSize,
          },
        },
      });

      return {
        passports: response.passports || [],
        total: response.paging.total,
      };
    },
    {
      refreshDeps: [search.role, search.status, search.page, search.pageSize],
      onError: (err) => Toast.error(err.message),
    }
  );

  const getCount = (name) => {
    const item = countData?.find((x) => x.key === name);
    return item?.value || 0;
  };

  const sideList = useMemo(
    () =>
      Object.keys(SYSTEM_ROLES).map((name) => ({
        name,
        title: SYSTEM_ROLES[name],
        num: getCount(name),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countData, getCount]
  );

  const columns = useMemo(
    () => [
      {
        label: t('team.passport.role'),
        name: 'role',
        options: {
          // eslint-disable-next-line react/no-unstable-nested-components
          customBodyRender: (action, { rowIndex }) => {
            const passportInfo = passportData?.passports[rowIndex];

            return (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}>
                <PassportImage createPassportSvg={createPassportSvg} passport={passportInfo} teamDid={teamDid} />
                <Box>{renderRole(passportInfo.title)}</Box>
              </Box>
            );
          },
        },
      },
      {
        label: t('team.passport.owner'),
        name: 'user',
        options: {
          customBodyRender: (user) => renderUser(user, inService),
        },
      },
      {
        label: t('team.passport.status'),
        name: 'status',
        options: {
          customBodyRender: renderStatus,
        },
      },
      {
        label: t('team.member.lastLogin'),
        name: 'lastLoginAt',
        options: {
          customBodyRender: (timestamp) => renderTime(timestamp, locale),
        },
      },
      {
        label: t('common.address'),
        name: 'id',
        options: {
          customBodyRender: renderDid,
        },
      },
      {
        label: t('blocklet.overview.source'),
        name: 'source',
        options: {
          customBodyRender: (source, { rowIndex }) => {
            const passportInfo = passportData?.passports[rowIndex];
            if (passportInfo.parentDid) {
              return renderSource('recover');
            }
            return renderSource(passportInfo.source);
          },
        },
      },
    ],
    [t, locale, passportData?.passports, teamDid, createPassportSvg, inService]
  );

  const onRoleChange = (role) => {
    setSearch((x) => ({ ...x, role, page: 1 }));
  };

  const onTableChange = ({ page, rowsPerPage, searchText }) => {
    if (search.pageSize !== rowsPerPage) {
      setSearch((x) => ({ ...x, searchText: '', pageSize: rowsPerPage, page: 1 }));
    } else if (search.page !== page + 1) {
      setSearch((x) => ({ ...x, searchText: '', page: page + 1 }));
    } else if (search.searchText !== searchText) {
      setSearch((x) => ({ ...x, searchText, page: 1 }));
    }
  };

  const datatableRef = useRef(null);

  const list = passportData?.passports || [];
  const passports = search.searchText
    ? list.filter((x) => x.id.includes(search.searchText) || (x?.user?.fullName || '').includes(search.searchText))
    : list;

  const tableOptions = {
    sort: false,
    download: false,
    filter: false,
    print: false,
    viewColumns: false,
    onRowClick(row, { dataIndex }, e) {
      if (datatableRef.current?.contains(e.target)) {
        const x = passportData?.passports[dataIndex];
        setPassportDialog(x);
      }
    },
    page: search.page - 1,
    rowsPerPage: search.pageSize,
    count: passportData?.total || 0,
    searchDebounceTime: 600,
  };

  const handleStatusChange = (event) => {
    setSearch((prev) => ({ ...prev, status: event.target.value, page: 1 }));
  };

  const statusFilter = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ fontSize: 16, fontWeight: 400 }}>{t('team.passport.status')}:</Box>
      <Select
        size="small"
        value={search.status}
        onChange={handleStatusChange}
        displayEmpty
        sx={{
          minWidth: 120,
          height: 36,
          '.MuiSelect-select': {
            py: 0.5,
            px: 1.5,
          },
        }}>
        <MenuItem value={STATUS_ALL}>{t('common.all')}</MenuItem>
        {Object.values(PASSPORT_STATUS).map((value) => (
          <MenuItem key={value} value={value} sx={{ py: 1 }}>
            {t(`team.passport.statusMap.${value}`)}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );

  if (countLoading) {
    return (
      <Box
        sx={{
          py: 2,
        }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            pb: 2,
          }}>
          <CircularProgress />
        </Stack>
      </Box>
    );
  }

  return (
    <Div>
      <Box
        className="main"
        sx={{
          display: 'flex',
          mt: 0,
          gap: 3,
        }}>
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

        <Box ref={datatableRef} className="right">
          <Datatable
            className="main-table"
            verticalKeyWidth={100}
            locale={locale}
            durable={durableKey}
            durableKeys={['page', 'rowsPerPage']}
            data={passports}
            columns={columns}
            options={tableOptions}
            loading={passportLoading}
            onChange={onTableChange}
            customButtons={[<Role createPassportSvg={createPassportSvg} />]}
            title={statusFilter}
          />
        </Box>
      </Box>
      {passport && (
        <PassportDetail
          createPassportSvg={createPassportSvg}
          onCancel={() => setPassportDialog(null)}
          passport={passport}
          onSwitchPassport={setPassportDialog}
        />
      )}
    </Div>
  );
}

PassportList.propTypes = {
  createPassportSvg: PropTypes.func.isRequired,
};

const Div = styled(Box)`
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

          &:nth-child(n + 2) {
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
`;
