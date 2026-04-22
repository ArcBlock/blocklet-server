/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable react/jsx-wrap-multilines */
import { useContext } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import get from 'lodash/get';

import { LocaleContext, useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Alert from '@mui/material/Alert';
import Spinner from '@mui/material/CircularProgress';
import Datatable, { getDurableData } from '@arcblock/ux/lib/Datatable';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';

import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/InfoOutlined';

import Tag from '@abtnode/ux/lib/tag';
import { formatError, formatToDate, isCertificateMatch } from '@abtnode/ux/lib/util';

import { useNodeContext } from '../../contexts/node';
import useQuery from '../../hooks/query';
import UpdateNginxCert from './rule/action/update-cert/nginx';
import DeleteCert from './rule/action/delete-cert';
import DetailCert from './rule/action/detail-cert';
import MatchedSites from './rule/action/matched-sites';
import Permission from '../permission';

const oneDayTimestamp = 1 * 24 * 60 * 60 * 1000;

const isExpired = expiresTime => {
  if (!expiresTime) return false;
  const currentTime = +new Date();
  const time = expiresTime - currentTime;

  return time <= 0;
};

const DURABLE_TABLE_KEY = 'ssl-certificates-table';

function ExpiresCell({ expiresTime = 0 }) {
  const { t, locale } = useContext(LocaleContext);

  if (!expiresTime) return null;

  const currentTime = +new Date();
  const time = expiresTime - currentTime;

  if (isExpired(expiresTime)) {
    return (
      <span style={{ fontSize: '16px', color: 'red', whiteSpace: 'nowrap' }}>{formatToDate(expiresTime, locale)}</span>
    );
  }

  return (
    <span style={{ color: time / oneDayTimestamp < 7 ? '#f90' : '#222', fontSize: '16px', whiteSpace: 'nowrap' }}>
      {formatToDate(expiresTime, locale)}
      <span style={{ marginLeft: 6 }}>
        ({Math.ceil(time / oneDayTimestamp)}
        {t('router.cert.leftDays')})
      </span>
    </span>
  );
}
ExpiresCell.propTypes = {
  expiresTime: PropTypes.number,
};

// eslint-disable-next-line react/prop-types
function TableCellInfoRow({ name, value, style = {}, icon, ...props }) {
  return (
    <TableCellContainer style={{ display: 'flex', alignItems: 'center', ...style }} {...props}>
      <span>{name}:</span>
      <span>{value}</span>
      {icon && icon}
    </TableCellContainer>
  );
}

const TableCellContainer = styled.div`
  & > span {
    margin: 5px;
  }
`;

function Status({ status = '', source = '', expiresTime }) {
  const { t } = useLocaleContext();

  if (isExpired(expiresTime)) {
    return <Tag type="error">{t('router.cert.expired')}</Tag>;
  }

  if (source === 'upload') {
    return <Tag type="success">{t('common.normal')}</Tag>;
  }

  if (status === 'error') {
    return <Tag type="error">{t('common.error')}</Tag>;
  }

  if (status === 'generated') {
    return <Tag type="success">{t('common.normal')}</Tag>;
  }

  return '';
}

Status.propTypes = {
  status: PropTypes.string,
  source: PropTypes.string,
  expiresTime: PropTypes.number.isRequired,
};

// 过滤 blocklet 对应的 certificates (#3898)
const filterCerts = (certificates, blocklet) => {
  if (!blocklet) {
    return certificates;
  }
  const blockletDomains = (blocklet.site.domainAliases || []).map(x => x.value);
  return certificates.filter(certificate => isCertificateMatch(blockletDomains, certificate.matchedSites));
};

export default function CertificateManager() {
  const { t, locale } = useContext(LocaleContext);
  const { api } = useNodeContext();
  const query = useQuery();
  const blockletDID = query.get('did');

  const state = useAsyncRetry(async () => {
    // eslint-disable-next-line no-shadow
    const { certificates } = await api.getCertificates();
    let blocklet = null;
    if (blockletDID) {
      // // FIXME: replace interfaces with site domainAlias
      const { blocklet: b } = await api.getBlocklet({ input: { did: blockletDID, attachRuntimeInfo: true } });
      blocklet = b;
    }
    const filtered = filterCerts(certificates, blocklet);
    return { certificates: filtered };
  });

  const onRefresh = () => {
    state.retry();
  };

  const cerData = state.value?.certificates;

  const columns = [
    {
      label: t('common.certificate'),
      name: '',
      verticalKeyAlign: 'center',
      options: {
        sort: false,
        filter: false,
        customBodyRenderLite: rawIndex => {
          const row = cerData[rawIndex];
          return (
            <>
              {row.name && (
                <TableCellInfoRow
                  nowrap
                  style={{ fontSize: '16px', whiteSpace: 'nowrap' }}
                  name={t('common.name')}
                  value={row.name}
                />
              )}
              <TableCellInfoRow
                style={{ fontSize: '16px', whiteSpace: 'nowrap' }}
                name={t('common.issuer')}
                value={get(row, 'meta.issuer.commonName', '')}
              />
              <TableCellInfoRow
                style={{ fontSize: '16px', whiteSpace: 'nowrap' }}
                icon={
                  <Tooltip
                    title={
                      row.isProtected
                        ? t('router.cert.protectedCertHelperText')
                        : t('router.cert.unprotectedCertHelperText')
                    }>
                    <InfoIcon style={{ fontSize: '18px' }} color="secondary" />
                  </Tooltip>
                }
                name={t('common.protected')}
                value={row.isProtected ? t('common.yes') : t('common.no')}
              />
            </>
          );
        },
      },
    },
    {
      label: t('router.cert.boundDomains'),
      name: '',
      options: {
        sort: false,
        filter: false,
        customBodyRenderLite: rawIndex => {
          const row = cerData[rawIndex];
          return (
            <Typography noWrap component="ul" style={{ listStyle: 'none' }}>
              {[...new Set([...(get(row, 'meta.sans') || []), row.domain])].map(s => (
                <Typography
                  component="li"
                  key={s}
                  title={s}
                  style={{ fontSize: '1.1rem', minWidth: 200, whiteSpace: 'initial', wordBreak: 'break-all' }}>
                  {s}
                </Typography>
              ))}
            </Typography>
          );
        },
      },
    },
    {
      label: t('router.cert.source'),
      name: '',
      options: {
        sort: false,
        filter: false,
        customBodyRenderLite: rawIndex => {
          const row = cerData[rawIndex];
          return t(`router.cert.sourceTypes.${row.source}`);
        },
      },
    },
    {
      label: t('common.status'),
      name: '',
      width: 100,
      options: {
        sort: false,
        filter: false,
        customBodyRenderLite: rawIndex => {
          const row = cerData[rawIndex];
          return <Status status={row.status} source={row.source} expiresTime={get(row, 'meta.validTo')} />;
        },
      },
    },
    {
      label: t('common.expires'),
      name: '',
      options: {
        sort: false,
        filter: false,
        customBodyRenderLite: rawIndex => {
          const row = cerData[rawIndex];
          return <RelativeTime value={get(row, 'meta.validTo')} locale={locale} />;
        },
      },
    },
    {
      label: t('router.cert.matchedSites'),
      name: '',
      options: {
        sort: false,
        filter: false,
        customBodyRenderLite: rawIndex => {
          const row = cerData[rawIndex];
          return (
            <MatchedSites
              id={row.id}
              certificate={row}
              style={{ minWidth: 200, whiteSpace: 'initial', wordBreak: 'break-all' }}
            />
          );
        },
      },
    },
    {
      label: t('router.cert.action'),
      name: '',
      align: 'center',
      options: {
        sort: false,
        filter: false,
        customBodyRenderLite: rawIndex => {
          const row = cerData[rawIndex];
          return (
            <Permission permission="mutate_router">
              <>
                {!row.isProtected && (
                  <>
                    {row.source === 'upload' && (
                      <div>
                        <UpdateNginxCert mode="update" certificate={row} onRefresh={onRefresh} />
                      </div>
                    )}
                    <div>
                      <DeleteCert id={row.id} domain={row.domain} onDelete={onRefresh} />
                    </div>
                  </>
                )}
                <div>
                  <DetailCert id={row.id} certificate={row} />
                </div>
              </>
            </Permission>
          );
        },
      },
    },
  ];

  if (state.error) {
    return <Alert severity="error">{formatError(state.error)}</Alert>;
  }

  if (state.loading) {
    return <Spinner />;
  }

  const tableDurableData = getDurableData(DURABLE_TABLE_KEY);

  return (
    <Div>
      <Datatable
        title={
          <Permission permission="mutate_router">
            <UpdateNginxCert mode="add" onRefresh={onRefresh} variant="contained" />
          </Permission>
        }
        locale={locale}
        data={state.value.certificates}
        columns={columns}
        verticalKeyWidth={100}
        durable={DURABLE_TABLE_KEY}
        options={{
          search: false,
          download: false,
          filter: false,
          print: false,
          ...tableDurableData,
        }}
      />
    </Div>
  );
}

const Div = styled.div`
  .header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 20px;
  }

  margin-bottom: 24px;
  .table-cell {
    span {
      font-size: 18px;
    }
    @media (max-width: ${props => props.theme.breakpoints.values.sm}px) {
      span {
        font-size: 15px;
      }
    }
  }
  .match-sites-cell,
  .expires-cell {
    min-width: 100px;
  }
  .actions {
    text-align: center;
    @media (max-width: ${props => props.theme.breakpoints.values.sm}px) {
      .MuiButton-root {
        padding: 6px;
      }
    }
  }
`;
