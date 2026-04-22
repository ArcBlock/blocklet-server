import { Box, useMediaQuery } from '@mui/material';
import { mergeSx } from '@arcblock/ux/lib/Util/style';
import { useCreation } from 'ahooks';
import AccessKey from '@abtnode/ux/lib/blocklet/access-key';

import useMobile from '../../../hook/use-mobile';

export default function AccessKeyUI() {
  const isMobile = useMobile({ key: 'md' });
  const isLg = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  const fieldSx = {
    display: 'flex',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    textAlign: 'right',
    '&.expired-at > div': {
      maxWidth: 160,
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
    },
  };

  const columnFieldSx = useCreation(() => {
    return mergeSx({}, isMobile ? fieldSx : {});
  }, [isMobile]);

  return (
    <Box
      id="user-center-access-key-setting"
      sx={{
        // eslint-disable-next-line no-nested-ternary
        maxWidth: isMobile ? 'unset' : isLg ? 'calc(100vw - 300px)' : '100%',
        ...(isMobile && {
          '.pc-access-key-table > div:nth-child(2)': {
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          },
        }),
        '.MuiTableCell-head': {
          whiteSpace: 'nowrap',
          fontWeight: 'bold',
        },
        '.MuiTableRow-root': {
          border: 'unset',
          '&:nth-child(even)': {
            backgroundColor: 'grey.50',
            '&:hover': {
              backgroundColor: (theme) => `${theme.palette.grey[50]} !important`,
            },
          },
        },
        '.MuiTableRow-hover': {
          '&:hover': {
            backgroundColor: 'inherit !important',
          },
        },
        '.MuiTableCell-root': {
          paddingRight: '8px',
          paddingLeft: '8px',
          color: 'text.secondary',
          ...(isMobile && {
            padding: '8px !important',
            '&:first-child': {
              paddingTop: '20px!important',
            },
            '&:last-child': {
              paddingBottom: '20px!important',
            },
          }),
        },
      }}>
      <AccessKey isSelf columnSx={columnFieldSx} />
    </Box>
  );
}
