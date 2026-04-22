import { lazy, useContext } from 'react';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getSessionToken } from '../../libs/util';

const GraphQLPlayground = lazy(() => import('@arcblock/graphql-playground'));

const defaultQuery = `{
  getNodeInfo {
    code
    info {
      did
      pk
    }
  }
}`;

const getExtraHeaders = () => {
  const headers = {};

  const token = getSessionToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    headers['x-real-hostname'] = window.location.hostname;
    headers['x-real-port'] = window.location.port;
    headers['x-real-protocol'] = window.location.protocol;
  }

  return headers;
};

export default function Console() {
  const { t } = useContext(LocaleContext);
  const endpoint = `${window.env && window.env.apiPrefix ? window.env.apiPrefix : ''}/api/gql`
    .replace(/\/+/g, '/')
    .trim();

  return (
    <GraphQLPlayground
      defaultQuery={defaultQuery}
      endpoint={endpoint}
      title={t('common.console')}
      enableHistory
      enableQueryComposer
      enableCodeExporter={false}
      extraHeaders={getExtraHeaders}
    />
  );
}
