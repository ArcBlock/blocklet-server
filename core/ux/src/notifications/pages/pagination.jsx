import { memo, useContext } from 'react';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import useMediaQuery from '@mui/material/useMediaQuery';
import TablePagination from '@mui/material/TablePagination';

NotificationPagination.propTypes = {
  paging: PropTypes.objectOf(PropTypes.any).isRequired,
  loading: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

function NotificationPagination({ loading, paging, onChange }) {
  const { t } = useContext(LocaleContext);
  const isMd = useMediaQuery((_theme) => _theme.breakpoints.down('md'));

  if (paging.pageCount <= 0 || isMd) {
    return null;
  }
  // TablePagination startPage 是 0
  // Pagination startPage 是 1
  // SQL 查询分页是从 1 开始的
  const handlePageChange = (e, pageNumber) => {
    onChange({ page: pageNumber + 1 });
  };

  const handleChangeRowsPerPage = (e) => {
    const pageSize = Number(e.target.value);
    // pageSize 变化回滚到第一页
    onChange({ page: 1, pageSize });
  };
  const page = paging.page - 1 <= 0 ? 0 : paging.page - 1;
  return (
    <Box
      className="notification-pagination"
      sx={{
        mt: 2,
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
      <TablePagination
        component="div"
        disabled={loading}
        count={paging.total}
        page={page}
        rowsPerPageOptions={[10, 20, 50, 100]}
        labelRowsPerPage={t('pagination.rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} / ${count !== -1 ? count : `${t()}more than ${to}`}`
        }
        rowsPerPage={paging.pageSize}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}

export default memo(NotificationPagination);
