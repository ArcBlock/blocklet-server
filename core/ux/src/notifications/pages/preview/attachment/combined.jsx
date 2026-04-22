/* eslint-disable react/require-default-props */
import { Typography, useTheme } from '@mui/material';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { mergeDarkStyle } from '../utils';

ComposeItem.propTypes = {
  data: PropTypes.object.isRequired,
  style: PropTypes.object,
};

function ComposeItem({ data, style = {} }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Typography
      style={mergeDarkStyle(
        {
          color: isDark && data.darkModeColor ? data.darkModeColor : data.color || 'initial',
          margin: 0,
          whiteSpace: 'pre-line!important',
          ...style,
        },
        isDark
      )}>
      {data.text}
    </Typography>
  );
}

function CombinedPreviewPage({ data }) {
  const content = [];
  for (let i = 0; i < data?.length; i += 2) {
    const firstCol = data[i];
    const secondCol = data[i + 1];
    if (firstCol && secondCol) {
      content.push(
        <TableRow key={i}>
          <td className="label-col">
            <ComposeItem data={firstCol.data} style={{ whiteSpace: 'nowrap', fontSize: '14px' }} />
          </td>
          <td className="value-col">
            <ComposeItem
              data={secondCol.data}
              style={{ wordBreak: 'break-all', textAlign: 'right', fontSize: '14px' }}
            />
          </td>
        </TableRow>
      );
    } else if (firstCol) {
      content.push(
        <TableRow key={i}>
          <td className="label-col">
            <ComposeItem data={firstCol.data} style={{ fontSize: '14px' }} />
          </td>
        </TableRow>
      );
    }
  }

  return (
    <table style={{ width: '100%' }}>
      <tbody>{content}</tbody>
    </table>
  );
}

CombinedPreviewPage.propTypes = {
  data: PropTypes.array.isRequired,
};

export default CombinedPreviewPage;

const TableRow = styled.tr`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  font-size: 14px;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1)} 0;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  &:first-child {
    padding-top: 0;
  }

  .label-col {
    min-width: 130px;
    flex-shrink: 0;
  }
  .value-col {
    flex: 1;
  }
`;
