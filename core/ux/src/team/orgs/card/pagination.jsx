import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box } from '@mui/material';
import TablePagination from '@mui/material/TablePagination';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useMemoizedFn } from 'ahooks';

export default function Pagination({ paging, loading = false, onChange = () => {} }) {
  const { locale } = useLocaleContext();
  const isMd = useMediaQuery((_theme) => _theme.breakpoints.down('lg'));

  const handlePageChange = useMemoizedFn((e, pageNumber) => {
    onChange({ page: pageNumber + 1 });
  });

  const handleChangeRowsPerPage = useMemoizedFn((e) => {
    const pageSize = Number(e.target.value);
    onChange({ page: 1, pageSize });
  });

  if (paging.pageCount <= 1) {
    return null;
  }

  const { page, pageSize, total } = paging;

  const pageNumber = page - 1 <= 0 ? 0 : page - 1;

  return (
    <Box
      className="pagination"
      sx={{ width: '100%', flex: 1, display: 'flex', justifyContent: isMd ? 'center' : 'flex-end' }}>
      <TablePagination
        component="div"
        disabled={loading}
        count={total}
        locale={locale}
        page={pageNumber}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[]}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}

Pagination.propTypes = {
  paging: PropTypes.shape({
    page: PropTypes.number,
    pageSize: PropTypes.number,
    total: PropTypes.number,
    pageCount: PropTypes.number,
  }).isRequired,
  loading: PropTypes.bool,
  onChange: PropTypes.func,
};
