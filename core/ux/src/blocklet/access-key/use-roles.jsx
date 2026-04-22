import { useMemo } from 'react';
import { useRoles } from './component';

import { useSessionContext } from '../../contexts/session';

export default function useAccessKeyRoles() {
  const { session } = useSessionContext();
  const roles = useRoles();

  const filteredRoles = useMemo(() => {
    if (!session?.user?.role) return [];

    if (['owner', 'admin'].includes(session.user.role)) {
      return roles;
    }

    const guestRoles = roles.filter((r) => r.name === 'guest');
    const filterRoles = roles.filter((r) => r.name !== 'guest');

    return [...filterRoles.filter((r) => session.user.passports.find((p) => p.role === r.name)), ...guestRoles];
  }, [roles, session?.user?.passports, session?.user?.role]);

  return filteredRoles;
}
