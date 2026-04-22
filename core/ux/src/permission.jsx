import PropTypes from 'prop-types';
import { useSessionContext } from './contexts/session';

export default function Permission({ permission = '', role = '', component = null, children = null }) {
  const { session } = useSessionContext();

  let can = true;

  const permissions = [].concat(permission).filter(Boolean);
  const roles = [].concat(role).filter(Boolean);

  if (permissions.length) {
    const userPermissions = (session.user && session.user.permissions) || [];
    can = permissions.some((p) => userPermissions.includes(p));
  }

  if (can && roles.length) {
    can = roles.includes(session.user.role);
  }

  if (typeof component === 'function') {
    return component(can);
  }

  if (typeof children === 'function') {
    return children(can);
  }

  if (can) {
    return component || children || null;
  }

  return null;
}

export function withPermission(Component, permissionName, role) {
  return function WithPermission(props) {
    return (
      <Permission permission={permissionName} role={role}>
        {(hasPermission) => <Component {...props} hasPermission={hasPermission} />}
      </Permission>
    );
  };
}

Permission.propTypes = {
  permission: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  role: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  component: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
};
