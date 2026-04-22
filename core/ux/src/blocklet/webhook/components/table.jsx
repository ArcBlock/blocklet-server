/* eslint-disable react/no-unstable-nested-components */
import Datatable from '@arcblock/ux/lib/Datatable';
import PropTypes from 'prop-types';

import { styled } from '@mui/material';
import React, { memo } from 'react';
import Empty from '@arcblock/ux/lib/Empty';

import useMediaQuery from '@mui/material/useMediaQuery';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

function EmptyStub() {
  return null;
}

function Table({
  options = {},
  columns = [],
  toolbar = true,
  footer = true,
  hasRowLink = false,
  emptyNodeText = '',
  durable = '',
  durableKeys = [],
  data = [],
  loading = false,
  ...rest
}) {
  const { locale } = useLocaleContext();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const defaultOptions = {
    print: false,
    download: false,
    filter: false,
    selectableRows: 'none',
    rowsPerPage: isMobile ? 5 : 10,
    rowsPerPageOptions: [5, 10, 20, 50, 100],
    searchDebounceTime: 300,
    tableBodyHeight: '100%',
    loading: true,
  };

  const components = {};
  if (!toolbar) {
    components.TableToolbar = EmptyStub;
  }
  if (!footer) {
    components.TableFooter = EmptyStub;
  }

  return (
    <Wrapped
      locale={locale}
      options={{ ...defaultOptions, ...options }}
      columns={(columns || []).map((x) => {
        x.options = x.options || {};
        x.options.filter = x.options.filter || false;
        x.options.sort = x.options.sort || false;
        return x;
      })}
      emptyNode={<Empty>{emptyNodeText}</Empty>}
      {...rest}
      durable={durable}
      durableKeys={durableKeys}
      data={data}
      loading={loading}
      components={components}
      hasRowLink={hasRowLink}
      isMobile={isMobile}
    />
  );
}
Table.propTypes = {
  options: PropTypes.object,
  columns: PropTypes.array,
  toolbar: PropTypes.bool,
  footer: PropTypes.bool,
  hasRowLink: PropTypes.bool,
  emptyNodeText: PropTypes.node,
  durable: PropTypes.string,
  durableKeys: PropTypes.array,
  data: PropTypes.array,
  loading: PropTypes.bool,
  onChange: PropTypes.func,
  title: PropTypes.node,
  components: PropTypes.object,
};

const Wrapped = styled(Datatable)``;

export default memo(Table);
