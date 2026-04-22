import PropTypes from 'prop-types';

import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';

import Actions from '../../actions';
import DeleteDomainAlias from './action/delete-domain-alias';

export default function DomainActions({ site, domain, blocklet, onDelete = () => {} }) {
  const { t } = useLocaleContext();

  const isCurrentDomain = domain.value === window.location.hostname;

  return (
    <Actions
      data-cy="domain-actions"
      size="large"
      actions={[
        // eslint-disable-next-line react/no-unstable-nested-components
        ({ close }) => (
          <DeleteDomainAlias id={site.id} domain={domain.value} teamDid={blocklet?.meta?.did} onDelete={onDelete}>
            {({ open }) => (
              <Tooltip title={isCurrentDomain ? t('blocklet.router.currentDomainTip') : ''}>
                <span>
                  <MenuItem
                    disabled={domain.isProtected || isCurrentDomain}
                    dense
                    key="remove"
                    onClick={(e) => {
                      close();
                      open(e);
                    }}
                    data-cy="action-toggle-block">
                    <ListItemIcon style={{ minWidth: 24, marginRight: 8 }}>
                      <DeleteIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('common.delete')} />
                  </MenuItem>
                </span>
              </Tooltip>
            )}
          </DeleteDomainAlias>
        ),
      ]}
    />
  );
}

DomainActions.propTypes = {
  site: PropTypes.object.isRequired,
  domain: PropTypes.object.isRequired,
  blocklet: PropTypes.object.isRequired,
  onDelete: PropTypes.func,
};
