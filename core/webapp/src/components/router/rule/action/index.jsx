/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import { useState } from 'react';
import PropTypes from 'prop-types';

import Menu from '@mui/material/Menu';
import IconMoreVert from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';

import { ROUTING_RULE_TYPES } from '@abtnode/constant';

import AddDomain from './add-domain';
import DeleteDomain from './delete-domain';
import AddRule from './add-rule';
import DeleteRule from './delete-rule';
import UpdateRule from './update-rule';
import AddDomainAlias from './add-domain-alias';
import UpdateDomainSecurity from './update-domain-security';
import UpdateDomain from './update-domain';

export default function RuleItemAction({ blocklet = {}, onRuleAdded = () => {}, type, ...rest }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const props = {
    type,
    blocklet,
    onRuleAdded,
    ...rest,
  };

  const onOpen = e => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const onClose = e => {
    if (e) {
      e.stopPropagation();
    }
    setAnchorEl(null);
  };

  const items = [];

  if (type === 'root') {
    items.push(<AddDomain key="add-domain" {...props} onActivate={onClose} />);
  }

  if (type === 'domain') {
    items.push(
      <UpdateDomain key="update-domain" {...props} onActivate={onClose} />,
      <AddRule key="add-rule" {...props} onActivate={onClose} onRuleAdded={props.onRuleAdded} />,
      <AddDomainAlias key="add-domain-alias" {...props} onActivate={onClose} />,
      <UpdateDomainSecurity key="update-domain-security" {...props} onActivate={onClose} />,
      <DeleteDomain key="delete-domain" {...props} onActivate={onClose} />
    );
  }

  if (type === 'rule') {
    items.push(
      <UpdateRule key="update-rule" {...props} onActivate={onClose} />,
      <DeleteRule key="delete-rule" {...props} onActivate={onClose} />
    );
  }

  if (type === ROUTING_RULE_TYPES.REDIRECT) {
    items.push(<DeleteDomain key="delete-domain" {...props} onActivate={onClose} />);
  }

  if (type === 'dashboard_domain') {
    items.push(
      <AddRule key="add-rule" {...props} onActivate={onClose} />,
      <UpdateDomainSecurity key="update-domain-security" {...props} onActivate={onClose} />,
      <AddDomainAlias key="add-domain-alias" {...props} onActivate={onClose} />
    );
  }

  if (type === 'blocklet_domain') {
    items.push(
      <UpdateDomainSecurity key="update-domain-security" {...props} onActivate={onClose} />,
      <AddDomainAlias key="add-domain-alias" {...props} onActivate={onClose} />
    );
  }

  if (items.length === 0) {
    return null;
  }

  const mouseDown = e => {
    e.stopPropagation();
  };

  return (
    <div>
      <IconButton onMouseDown={mouseDown} onClick={onOpen} data-cy="action-trigger" size="large">
        <IconMoreVert />
      </IconButton>
      <Menu
        keepMounted
        onMouseDown={mouseDown}
        open={!!anchorEl}
        onClose={onClose}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        {items}
      </Menu>
    </div>
  );
}

RuleItemAction.propTypes = {
  blocklet: PropTypes.object,
  onRuleAdded: PropTypes.func,
};
