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
import Tag from '@arcblock/ux/lib/Tag';
import EditIcon from '@arcblock/icons/lib/EditIcon';
import DeleteIcon from '@arcblock/icons/lib/DeleteIcon';
import Toast from '@arcblock/ux/lib/Toast';
import TableSearch from '@arcblock/ux/lib/Datatable/TableSearch';

import DidAddress from '../../did-address';
import { withPermission } from '../../permission';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import { sleep, BlockletAdminRoles } from '../../util';

import Confirm from '../../confirm';
import TrustedFactory from './trusted-factory';
import ListHeader from '../../list-header';

function TrustedFactories({ onCancel, hasPermission = false }) {
  const { api } = useNodeContext();
  const { teamDid, trustedFactories } = useTeamContext();
  const { t } = useLocaleContext();
  const [delConfirm, setDelConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trustedFactory, setTrustedFactory] = useState(null);
  const [search, setSearch] = useState('');

  const deleteTrustedFactory = async (did) => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      await api.configTrustedFactories({
        input: {
          teamDid,
          trustedFactories: trustedFactories.filter((x) => x.factoryAddress !== did),
        },
      });
      await sleep(800);
      setLoading(false);
      Toast.success(t('common.saveSuccess'));
      setDelConfirm(null);
    } catch (err) {
      setLoading(false);
      Toast.error(err.message);
    }
  };

  const filterFactories = trustedFactories.filter(
    (x) => !search || x.factoryAddress.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog
      title={t('team.passport.trustedFactories')}
      open
      onClose={onCancel}
      fullWidth
      PaperProps={{ style: { minHeight: '80vh' } }}>
      <Div>
        <div className="dialog-content">
          <div className="dialog-h1">{t('team.passport.trustedFactoriesTip')}</div>

          <ListHeader
            sx={{ mt: 3 }}
            actions={
              <>
                <TableSearch
                  options={{
                    searchPlaceholder: t('team.passport.searchFactoryAddress'),
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
                    size="small"
                    data-cy="add-trusted-factory"
                    onClick={() => setTrustedFactory({ mode: 'add' })}>
                    <AddIcon style={{ fontSize: 16, marginRight: 4 }} />
                    {t('team.add')}
                  </Button>
                )}
              </>
            }
          />

          <div className="list">
            {filterFactories.map((x) => (
              <Box
                key={x.factoryAddress}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: '20px',
                }}>
                <Box
                  sx={{
                    flexGrow: 1,
                  }}>
                  <DidAddress copyable={false} did={x.factoryAddress} size={16} showDidLogo={false} />
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
                    mr: '24px',
                  }}>
                  <Tag type="success">{x.passport.role}</Tag>
                </Box>
                <Box
                  sx={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                  <IconButton
                    onClick={() => setTrustedFactory({ mode: 'update', data: cloneDeep(x) })}
                    data-cy="edit-trusted-factory"
                    size="large">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    data-cy="delete-trusted-factory"
                    onClick={() =>
                      setDelConfirm({
                        title: t('common.delete'),
                        description: t('common.delConfirmDescription', { data: x.factoryAddress }),
                        confirm: t('common.delConfirm'),
                        cancel: t('common.cancel'),
                        onConfirm: () => deleteTrustedFactory(x.factoryAddress),
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
            {!trustedFactories.length && <Empty>{t('common.empty')}</Empty>}
          </div>
        </div>
      </Div>
      {trustedFactory && (
        <TrustedFactory
          data={trustedFactory.data}
          trustedFactories={cloneDeep(trustedFactories)}
          onCancel={() => setTrustedFactory(null)}
          onSuccess={() => {
            setTrustedFactory(null);
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

TrustedFactories.propTypes = {
  onCancel: PropTypes.func.isRequired,
  hasPermission: PropTypes.bool,
};

const TrustedFactoriesInDaemon = withPermission(TrustedFactories, 'mutate_team');
const TrustedFactoriesInService = withPermission(TrustedFactories, '', BlockletAdminRoles);

export default function TrustedFactoriesWithPermission(props) {
  const { inService } = useNodeContext();
  if (inService) {
    return <TrustedFactoriesInService {...props} />;
  }

  return <TrustedFactoriesInDaemon {...props} />;
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
