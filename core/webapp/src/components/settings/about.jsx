import React from 'react'; // eslint-disable-line no-unused-vars
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import get from 'lodash/get';

import Box from '@mui/material/Box';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import Tag from '@arcblock/ux/lib/Tag';
import DidAddress from '@abtnode/ux/lib/did-address';

// eslint-disable-next-line import/no-unresolved
import Logo from '../../assets/logo.svg';

import { useNodeContext } from '../../contexts/node';
import MaintainConfirm from '../node/maintain/confirm';
import UpgradeCheck from '../node/maintain/check';
import CacheManager from '../node/maintain/cache';
import MaintainSessionKey from '../node/maintain/session-key';
import RegisterNode from '../node/register';
import Permission from '../permission';

export default function About() {
  const navigate = useNavigate();
  const { api, info } = useNodeContext();
  const { t } = useLocaleContext();
  const extra = useAsyncRetry(async () => {
    const res = await api.getNodeEnv();
    return Object.assign({}, res.info || {});
  });

  const rows = [];

  rows.push(
    { name: t('dashboard.nodeDid'), value: <DidAddress did={info.did} showQrcode /> },
    info.nodeOwner ? { name: t('dashboard.ownerDid'), value: <DidAddress did={info.nodeOwner.did} showQrcode /> } : null
  );

  if (extra.value) {
    rows.push(
      { name: t('dashboard.routingEngine'), value: extra.value.routerProvider },
      { name: t('dashboard.database'), value: extra.value.dbProvider },
      { name: `${t('common.os')}`, value: extra.value.os },
      extra.value.docker ? { name: `${t('common.docker')}`, value: <Tag type="success">Yes</Tag> } : null,
      extra.value.gitpod ? { name: `${t('common.gitpod')}`, value: <Tag type="success">Yes</Tag> } : null
    );
  }

  if (Array.isArray(get(extra, 'value.blockletEngines', null))) {
    extra.value.blockletEngines
      .filter(e => e.visible && e.available)
      .forEach(e => {
        rows.push({
          name: e.displayName,
          value: e.version,
        });
      });
  }

  return (
    <Container>
      <Permission permission="mutate_node">
        {can => (
          <>
            <Box
              style={{ marginBottom: 24 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                }}>
                <img src={Logo} height={50} alt="" />
              </Box>
              <Box
                sx={{
                  ml: 2,
                }}>
                <h2 style={{ margin: 0 }}>{info.name}</h2>
                <p style={{ margin: 0, color: '#888' }}>{info.description}</p>
              </Box>
            </Box>

            <InfoRow
              style={{ marginBottom: 4 }}
              valueComponent="div"
              key="version"
              nameWidth={150}
              name={t('common.version')}>
              {info.version}
              {can && <UpgradeCheck />}
            </InfoRow>

            {rows.filter(Boolean).map(x => (
              <InfoRow valueComponent="div" key={x.name} nameWidth={150} name={x.name}>
                {x.value}
              </InfoRow>
            ))}

            {can && (
              <div style={{ maxWidth: 720, marginBottom: '1vw' }}>
                <MaintainConfirm action="upgrade" />
              </div>
            )}
          </>
        )}
      </Permission>
      <Permission permission="mutate_node">
        {can =>
          can && (
            <div style={{ maxWidth: 720, marginBottom: '1vw' }}>
              <MaintainConfirm action="restart" />
            </div>
          )
        }
      </Permission>
      <Permission permission="mutate_node">
        {can =>
          can && (
            <div style={{ maxWidth: 720, marginBottom: '1vw' }}>
              <MaintainConfirm action="restartAllBlocklet" />
            </div>
          )
        }
      </Permission>
      <Permission permission="mutate_router">
        {can =>
          can && (
            <div style={{ maxWidth: 720, marginBottom: '1vw' }}>
              <CacheManager />
            </div>
          )
        }
      </Permission>
      <Permission permission="mutate_node">
        {can =>
          can && (
            <div style={{ maxWidth: 720, marginBottom: '1vw' }}>
              <MaintainSessionKey />
            </div>
          )
        }
      </Permission>
      <Permission permission="mutate_blocklets">
        {!!info.registerUrl && (
          <div style={{ maxWidth: 720, marginTop: '-1vw' }}>
            <RegisterNode />
          </div>
        )}
      </Permission>
      <Box
        style={{ marginLeft: -8 }}
        sx={{
          mt: 10,
        }}>
        <Button
          className="eula-btn"
          onClick={() => {
            navigate('/eula');
          }}>
          {t('common.goEULA')}
        </Button>
      </Box>
    </Container>
  );
}
const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 32px;
`;
