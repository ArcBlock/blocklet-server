import { createContext, useState, useContext, useEffect } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import Toast from '@arcblock/ux/lib/Toast';

import { useNodeContext } from './node';

const AuditLogContext = createContext({});
const { Provider, Consumer } = AuditLogContext;

function getPageSize() {
  return localStorage.getItem('audit-log-page-size') ? Number(localStorage.getItem('audit-log-page-size')) || 10 : 10;
}

// eslint-disable-next-line react/prop-types
function AuditLogProvider({ children, scope = '', categories = [], showScope, scopeFormatter, blocklets }) {
  const { api: client, info: nodeInfo } = useNodeContext();
  const [auditLogs, setAuditLogs] = useState([]);
  const [paging, setPaging] = useState({
    total: 0,
    pageSize: getPageSize(),
    pageCount: 0,
    page: 1,
  });

  const [loading, setLoading] = useState(false);
  const [actionOrContent, setActionOrContent] = useState('');
  const [category, setCategory] = useLocalStorage(`audit-log-category-${scope}`, 'all');
  const categoryList = [
    { value: 'all', label: 'All', description: '' },
    { value: 'blocklet', label: 'Blocklet Management', description: '' },
    { value: 'server', label: 'Server Management', description: '' },
    { value: 'team', label: 'Team Management', description: '' },
    { value: 'security', label: 'Security', description: '' },
    { value: 'certificates', label: 'Certificate Management', description: '' },
    { value: 'integrations', label: 'Integration Management', description: '' },
    { value: 'gateway', label: 'Gateway', description: '' },
  ];
  const filterCategories = categoryList.filter((item) => {
    if (categories.length) {
      return item.value === 'all' || categories.includes(item.value);
    }
    return true;
  });

  const fetchLogs = async ({ page = 1, pageSize = 20, silent = true } = {}) => {
    if (loading) {
      return;
    }
    if (!silent) {
      setLoading(true);
    }
    try {
      // eslint-disable-next-line no-shadow
      const res = await client.getAuditLogs({
        // 由于 blocklet 中的 audit-log 本身就不包含 server 类型的，所以这里的 category 查询不需要对 server 类型的做额外的处理
        input: { paging: { page, pageSize }, category: category === 'all' ? '' : category, scope, actionOrContent },
      });

      // add link for blocklet audit logs
      if (showScope) {
        (res.list || []).forEach((x) => {
          if (x.scope !== nodeInfo.did) {
            x.link = `/blocklets/${x.scope}/components`;
          }
        });
      }

      setAuditLogs(res.list);
      setPaging(res.paging);
      setLoading(false);
    } catch (err) {
      Toast.error(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('audit-log-page-size', paging.pageSize);
  }, [paging.pageSize]); // eslint-disable-line

  useEffect(() => {
    fetchLogs({ page: 1, pageSize: paging.pageSize, silent: false });
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchLogs({ page: 1, pageSize: paging.pageSize, silent: false });
  }, [category, actionOrContent]); // eslint-disable-line

  const value = {
    loading,
    fetch: fetchLogs,
    filter: { category, scope },
    categories: filterCategories,
    blocklets,
    setCategory,
    data: auditLogs,
    paging,
    setPaging,
    showScope,
    scopeFormatter,
    actionOrContent,
    setActionOrContent,
  };

  return <Provider value={{ auditLogs: value }}>{children}</Provider>;
}

function useAuditLogContext() {
  const { auditLogs } = useContext(AuditLogContext);
  return auditLogs;
}

export { AuditLogContext, AuditLogProvider, Consumer as AuditLogConsumer, useAuditLogContext };
