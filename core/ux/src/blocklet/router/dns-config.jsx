import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from '@mui/material/Link';
import Copyable from '../../click-to-copy';
import { getDomainName } from './util';

function ExternalLink({ children = null, href = '', sx = null, showIcon = false, ...props }) {
  const theme = useTheme();

  return (
    <Link
      href={href}
      target="_blank"
      {...props}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        color: 'text.primary',
        ':hover': {
          color: theme.palette.primary.main,
        },
        ...sx,
      }}>
      {children}
      {showIcon && <OpenInNewIcon fontSize="small" sx={{ ml: '4px', fontSize: '1rem' }} />}
    </Link>
  );
}
ExternalLink.propTypes = {
  children: PropTypes.node,
  sx: PropTypes.object,
  href: PropTypes.string,
  showIcon: PropTypes.bool,
};

function DnsRecords({ records }) {
  return (
    <TableContainer component={Box} sx={{ '.MuiTableCell-root': { color: 'text.primary' } }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.name}>
              <TableCell>{record.type}</TableCell>
              <TableCell>{record.name}</TableCell>
              <TableCell sx={{ wordBreak: 'break-word' }}>
                <Copyable>{record.data}</Copyable>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

DnsRecords.propTypes = {
  records: PropTypes.array.isRequired,
};

export default function DNSConfigure({ url, domain = '' }) {
  const { t } = useLocaleContext();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography component="h3" variant="h6">
          {t('setting.dns.step1Title')}
        </Typography>
        <Typography component="section">
          {t('setting.dns.step1Desc1')}
          <ExternalLink href="https://lookup.icann.org/" target="_blank">
            ICANN
          </ExternalLink>
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}>
        <Typography component="h3" variant="h6">
          {t('setting.dns.step2Title', { url })}
        </Typography>
        <Typography component="section">{t('setting.dns.step2Desc')}</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography component="h3" variant="h6">
          {t('setting.dns.step3Title')}
        </Typography>
        <Typography component="section">{t('setting.dns.step3Desc')}</Typography>
        <DnsRecords records={[{ type: 'CNAME', name: getDomainName(url), data: domain }]} />
      </Box>
    </Box>
  );
}

DNSConfigure.propTypes = {
  url: PropTypes.string.isRequired,
  domain: PropTypes.string,
};
