import NodeClient from '@blocklet/server-js';
import { getLocale } from '@arcblock/ux/lib/Locale/context';

const prefix = (window.env ? window.env.apiPrefix : '/') || '/';
const client = new NodeClient(() => `${prefix}/api/gql?locale=${getLocale()}`.replace(/\/+/g, '/').trim());

export default client;
