/**
 * 路由不匹配情况下的 fallback 组件
 */

import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';

import { ROLES, WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { useSessionContext } from './contexts/session';

export default function Fallback() {
  const { session } = useSessionContext() || {};

  const isAdminRole = useMemo(() => {
    const role = session?.user?.role || '';
    return [ROLES.OWNER, ROLES.ADMIN].includes(role);
  }, [session?.user?.role]);

  if (!session?.user) {
    return <Navigate to="/" replace />;
  }

  if (isAdminRole) {
    return <Navigate to={`${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/overview`} replace />;
  }

  return <Navigate to={`${WELLKNOWN_SERVICE_PATH_PREFIX}/user`} replace />;
}
