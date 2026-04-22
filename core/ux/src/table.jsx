import styled from '@emotion/styled';

const TableStyle = styled.div`
  .MuiPaper-root {
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    background: transparent;
  }
  .MuiToolbar-root {
    background: transparent;
    padding-left: 0;
    display: none;
  }

  &.show-pagination {
    .MuiTablePagination-toolbar {
      display: flex;
    }
  }

  .MuiTableHead-root th {
    min-width: 100px;
    background: transparent;
  }

  .MuiTable-root {
    overflow-y: hidden;
  }
  .MuiTableRow-root {
    border: none !important;
  }

  .MuiTableCell-root {
    padding-right: 16px;
    &:last-of-type {
      padding-right: 0;
    }
    & > h6 {
      color: ${({ theme }) => theme.palette.text.secondary};
    }
  }

  /* @material-table/core@next 兼容 mui v5, 但 pagination 样式似乎有些问题, 暂地定制下面的样式修复, 后面考虑弃用 material-table  */
  .MuiTablePagination-selectLabel,
  .MuiTablePagination-displayedRows {
    display: none;
  }
  .MuiTypography-caption {
    display: inline-block;
  }
  .MuiTablePagination-selectLabel + .MuiInputBase-root {
    margin-right: 8px;
  }
`;

export default TableStyle;
