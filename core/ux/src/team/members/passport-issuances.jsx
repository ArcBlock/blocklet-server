/* eslint-disable react/prop-types */
import { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Toast from '@arcblock/ux/lib/Toast';

import Box from '@mui/material/Box';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import Confirm from '../../confirm';
import Permission from '../../permission';
import ClickToCopy from '../../click-to-copy';
import PassportTag from '../../passport-tag';
import { getIssuePassportLink, formatToDatetime, BlockletAdminRoles } from '../../util';

export default function PassportIssuances({ issuances = [], teamDid, onRefresh = () => {} }) {
  const { api: client, inService } = useNodeContext();
  const { t, locale } = useContext(LocaleContext);
  const [delConfirm, setDelConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const { endpoint } = useTeamContext();

  const deleteIssuance = async ({ id }) => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      await client.deletePassportIssuance({ input: { teamDid, sessionId: id } });
      onRefresh();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      setLoading(false);
      setDelConfirm(null);
    }
  };

  const onCancel = () => {
    setLoading(false);
    setDelConfirm(null);
  };

  const getLink = (column) => (endpoint ? getIssuePassportLink({ id: column.id, endpoint }) : '');

  // eslint-disable-next-line react/prop-types
  // eslint-disable-next-line react/no-unstable-nested-components
  function Issuance({ data: d }) {
    return (
      <div className="issuance">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}>
          <Permission permission={inService ? '' : 'mutate_team'} role={inService ? BlockletAdminRoles : []}>
            {(can) =>
              can ? (
                <PassportTag
                  passport={{ title: d.title, name: d.name }}
                  onDelete={() =>
                    setDelConfirm({
                      title: t('team.passport.issuance.delete.title'),
                      description: t('team.passport.issuance.delete.description', { link: getLink(d) }),
                      confirm: t('common.delConfirm'),
                      cancel: t('common.cancel'),
                      onConfirm: () => {
                        deleteIssuance(d);
                      },
                      onCancel,
                    })
                  }
                />
              ) : (
                <PassportTag passport={{ title: d.title, name: d.name }} />
              )
            }
          </Permission>
          <div style={{ color: '#999' }}>
            {t('common.expires')}
            :&nbsp;
            {formatToDatetime(d.expireDate, locale)}
          </div>
        </Box>
        <Box
          sx={{
            mt: 2,
          }}>
          <ClickToCopy>{getLink(d)}</ClickToCopy>
        </Box>
      </div>
    );
  }

  return (
    <Div>
      {issuances.map((x) => (
        <Issuance data={x} />
      ))}
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

const Div = styled.div`
  .MuiTableHead-root {
    display: none;
  }
  .issuance {
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
    .MuiTypography-root {
      display: inline-block;
      width: 100%;
      background: #f3f3f3;
      border-radius: 4px;
      padding-top: 6px;
      padding-bottom: 6px;
    }
  }
`;

PassportIssuances.propTypes = {
  teamDid: PropTypes.string.isRequired,
  issuances: PropTypes.array,
  onRefresh: PropTypes.func,
};
