import Box from '@mui/material/Box';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { TableFilterList } from '@arcblock/ux/lib/Datatable';
import PropTypes from 'prop-types';

CustomFilterList.propTypes = {
  itemComponent: PropTypes.elementType.isRequired,
};
export default function CustomFilterList({ itemComponent, ...rest }) {
  const { t } = useLocaleContext();
  // eslint-disable-next-line react/prop-types
  const hasFilter = !!rest?.filterList?.filter((e) => e.length).length;
  if (!hasFilter) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
      }}>
      <div className="toolbar-filter-title">{t('notification.filter')}</div>
      <div className="toolbar-filter-content">
        <TableFilterList {...rest} ItemComponent={itemComponent} />
      </div>
    </Box>
  );
}
