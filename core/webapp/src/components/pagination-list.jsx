import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Empty from '@arcblock/ux/lib/Empty';

export default function PaginationList({ list = [], rowsPerPage = 10, children = () => null, empty = undefined }) {
  const { t } = useLocaleContext();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [list.length]);

  const count = Math.ceil(list.length / rowsPerPage);
  const offset = (page - 1) * rowsPerPage;
  const data = list.slice(offset, offset + rowsPerPage);

  const emptyElement = empty !== undefined ? empty : <Empty>{t('common.empty')}</Empty>;

  return (
    <>
      {children(data)}
      {!list.length && emptyElement}
      {!!list.length && count > 1 && (
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
          <Pagination
            count={count}
            page={page}
            onChange={(e, value) => {
              setPage(value);
            }}
          />
        </Box>
      )}
    </>
  );
}

PaginationList.propTypes = {
  list: PropTypes.array,
  rowsPerPage: PropTypes.number,
  children: PropTypes.func,
  empty: PropTypes.element,
};
