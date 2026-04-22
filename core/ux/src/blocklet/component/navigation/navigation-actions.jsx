import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import IconButton from '@mui/material/IconButton';
import { useCallback, isValidElement } from 'react';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

function NavigationActions({
  className = '',
  add = () => {},
  edit = () => {},
  toggle = () => {},
  del = () => {},
  data,
  section = '',
}) {
  const { t } = useLocaleContext();
  const isDisabled = ['yaml', 'team-tmpl'].includes(data.from);
  const isUninstalled = isValidElement(data.subtitle);
  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const handleClickAdd = useCallback(
    (e) => {
      handleClick(e);
      add(data);
    },
    [add, data]
  );
  const handleClickEdit = useCallback(
    (e) => {
      handleClick(e);
      edit(data);
    },
    [edit, data]
  );
  const handleClickToggle = useCallback(
    (e) => {
      handleClick(e);
      toggle(data);
    },
    [toggle, data]
  );
  const handleClickDelete = useCallback(
    (e) => {
      handleClick(e);
      del(data);
    },
    [del, data]
  );

  return (
    <div className={className}>
      {!data.parent && ['header', 'footer', 'dashboard'].includes(section) && (
        <span title={isUninstalled ? t('navigation.action.noAddSub') : t('navigation.action.addSub')}>
          <IconButton size="small" color="success" onClick={handleClickAdd} disabled={isUninstalled}>
            <Icon icon="mdi:plus-box-outline" />
          </IconButton>
        </span>
      )}
      <span title={isUninstalled ? t('navigation.action.noEdit') : t('navigation.action.edit')}>
        <IconButton
          size="small"
          color="primary"
          onClick={handleClickEdit}
          disabled={isUninstalled || data.from === 'team-tmpl'}>
          <Icon icon="mdi:pencil-outline" />
        </IconButton>
      </span>
      <span
        title={
          // eslint-disable-next-line no-nested-ternary
          isUninstalled
            ? t('navigation.action.noEdit')
            : data.visible
              ? t('navigation.action.hide')
              : t('navigation.action.show')
        }>
        <IconButton size="small" color="warning" onClick={handleClickToggle} disabled={isUninstalled}>
          {data.visible === false ? <Icon icon="mdi:eye-off-outline" /> : <Icon icon="mdi:eye-outline" />}
        </IconButton>
      </span>
      <span title={isDisabled && !isUninstalled ? t('navigation.action.noDel') : t('navigation.action.del')}>
        <IconButton disabled={isDisabled && !isUninstalled} size="small" color="error" onClick={handleClickDelete}>
          <Icon icon="mdi:delete" />
        </IconButton>
      </span>
    </div>
  );
}
NavigationActions.propTypes = {
  data: PropTypes.object.isRequired,
  className: PropTypes.string,
  add: PropTypes.func,
  edit: PropTypes.func,
  toggle: PropTypes.func,
  del: PropTypes.func,
  section: PropTypes.string,
};

export default NavigationActions;
