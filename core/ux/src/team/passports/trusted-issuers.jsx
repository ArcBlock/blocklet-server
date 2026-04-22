import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import cloneDeep from 'lodash/cloneDeep';

import Dialog from '@arcblock/ux/lib/Dialog';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import Empty from '@arcblock/ux/lib/Empty';
import EditIcon from '@arcblock/icons/lib/EditIcon';
import DeleteIcon from '@arcblock/icons/lib/DeleteIcon';
import Toast from '@arcblock/ux/lib/Toast';
import TableSearch from '@arcblock/ux/lib/Datatable/TableSearch';
import { toAddress } from '@arcblock/did';

import DidAddress from '../../did-address';
import { withPermission } from '../../permission';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import { sleep, BlockletAdminRoles } from '../../util';

import Confirm from '../../confirm';
import ListHeader from '../../list-header';
import TrustedIssuer from './trusted-issuer';

function TrustedIssuers({ onCancel, hasPermission = false }) {
  const { api } = useNodeContext();
  const { teamDid, trustedPassports } = useTeamContext();
  const { t } = useLocaleContext();
  const [delConfirm, setDelConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trustedIssuer, setTrustedIssuer] = useState(false);
  const [search, setSearch] = useState('');

  const deleteTrustedIssuer = async (did) => {
    if (loading) {
      return;
    }

    const index = trustedPassports.findIndex((x) => x.issuerDid === did);

    if (index === -1) {
      // should not be here
      Toast.error('Cannot find passports');
    }

    const trustedList = [...trustedPassports];
    trustedList.splice(index, 1);

    try {
      setLoading(true);
      await api.configTrustedPassports({ input: { teamDid, trustedPassports: trustedList } });
      await sleep(800);
      setLoading(false);
      Toast.success(t('common.saveSuccess'));
      setDelConfirm(false);
    } catch (err) {
      setLoading(false);
      Toast.error(err.message);
    }
  };

  const filteredIssuers = trustedPassports.filter(
    (x) => !search || x.issuerDid.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog
      title={t('team.passport.trustedIssuers')}
      open
      onClose={onCancel}
      fullWidth
      PaperProps={{ style: { minHeight: '80vh' } }}>
      <Div>
        <div className="dialog-content">
          <div className="dialog-h1">{t('team.passport.trustedPassportIssuers')}</div>

          <ListHeader
            sx={{ mt: 3 }}
            actions={
              <>
                <TableSearch
                  options={{
                    searchPlaceholder: t('team.passport.searchIssuerDid'),
                    searchDebounceTime: 600,
                  }}
                  search={search}
                  searchText={search}
                  searchTextUpdate={setSearch}
                  searchClose={() => setSearch('')}
                  onSearchOpen={() => {}}
                />

                {hasPermission && (
                  <Button
                    variant="contained"
                    color="primary"
                    data-cy="add-trusted-issuer"
                    onClick={() => setTrustedIssuer({ mode: 'add' })}>
                    <AddIcon style={{ fontSize: 16, marginRight: 4 }} />
                    {t('team.add')}
                  </Button>
                )}
              </>
            }
          />

          <div className="list">
            {filteredIssuers.map((x) => (
              <Box
                key={x.issuerDid}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: '20px',
                }}>
                <Box
                  sx={{
                    flexShrink: 0,
                  }}>
                  <DidAddress copyable={false} size={16} did={toAddress(x.issuerDid)} showDidLogo={false} />
                  {!!x.remark && (
                    <Box
                      sx={{
                        fontSize: 12,
                        maxWidth: '300px',
                      }}>
                      {x.remark}
                    </Box>
                  )}
                </Box>
                <Box
                  sx={{
                    color: 'gray',
                    ml: '28px',
                    flexGrow: 1,
                  }}>
                  {x.mappings && x.mappings.length
                    ? `${x.mappings.length} ${t('team.passport.mappingRule')}`
                    : t('team.passport.defaultRule')}
                </Box>
                <Box
                  sx={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                  <IconButton
                    onClick={() => setTrustedIssuer({ mode: 'update', data: cloneDeep(x) })}
                    data-cy="edit-mapping-rule"
                    size="large">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    data-cy="delete-mapping-rule"
                    onClick={() =>
                      setDelConfirm({
                        title: t('common.delete'),
                        description: t('common.delConfirmDescription', { data: x.issuerDid }),
                        confirm: t('common.delConfirm'),
                        cancel: t('common.cancel'),
                        onConfirm: () => deleteTrustedIssuer(x.issuerDid),
                        onCancel: () => {
                          setLoading(false);
                          setDelConfirm(null);
                        },
                      })
                    }
                    size="large">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            ))}
            {!trustedPassports.length && <Empty>{t('common.empty')}</Empty>}
          </div>
        </div>
      </Div>
      {trustedIssuer && (
        <TrustedIssuer
          mode={trustedIssuer.mode}
          data={trustedIssuer.data}
          trustedPassports={cloneDeep(trustedPassports)}
          onCancel={() => setTrustedIssuer(null)}
          onSuccess={() => {
            setTrustedIssuer(null);
          }}
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

TrustedIssuers.propTypes = {
  onCancel: PropTypes.func.isRequired,
  hasPermission: PropTypes.bool,
};

const TrustedIssuersInDaemon = withPermission(TrustedIssuers, 'mutate_team');
const TrustedIssuersInService = withPermission(TrustedIssuers, '', BlockletAdminRoles);

export default function TrustedIssuersWithPermission(props) {
  const { inService } = useNodeContext();
  if (inService) {
    return <TrustedIssuersInService {...props} />;
  }

  return <TrustedIssuersInDaemon {...props} />;
}

const Div = styled.div`
  .list {
    .MuiIconButton-root {
      svg {
        fill: #bfbfbf;
      }
    }
  }
`;
