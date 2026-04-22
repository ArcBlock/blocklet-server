/* eslint-disable react/jsx-one-expression-per-line */
import { useContext } from 'react';
import PropTypes from 'prop-types';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import MaterialTable from '@material-table/core';
import { getBlockletServices } from '@blocklet/meta/lib/util';

import TableStyle from '../table';
import tableIcons from '../table-icons';

export default function BlockletService({ blocklet, ...rest }) {
  const { t } = useContext(LocaleContext);
  const services = getBlockletServices(blocklet);

  if (services.length === 0) {
    return <div>{t('blocklet.noService')}</div>;
  }

  const columns = [
    {
      title: t('common.name'),
      field: 'name',
    },
    {
      title: t('common.protocol'),
      field: 'protocol',
    },
    {
      title: t('common.port'),
      field: 'port',
    },
    {
      title: t('blocklet.upstreamPort'),
      field: 'upstreamPort',
    },
  ];

  return (
    <TableStyle {...rest}>
      <MaterialTable
        columns={columns}
        icons={{ ...tableIcons }}
        options={{
          sorting: false,
          emptyRowsWhenPaging: false,
          actionsColumnIndex: -1,
          tableLayout: 'auto',
          maxBodyHeight: '100%',
          search: false,
          pageSize: 1000,
          pageSizeOptions: [1000],
        }}
        localization={{
          body: {
            emptyDataSourceMessage: t('blocklet.noService'),
          },
        }}
        data={services}
      />
    </TableStyle>
  );
}

BlockletService.propTypes = {
  blocklet: PropTypes.object.isRequired,
};
