import { CopyButton } from '@arcblock/ux/lib/ClickToCopy';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Typography, Box, Stack, useTheme, useMediaQuery } from '@mui/material';
import PropTypes from 'prop-types';

export default function DNSTip({ domain = '', resolvedTarget, ...rest }) {
  const { t, locale } = useLocaleContext();
  return (
    <Box
      sx={{
        backgroundColor: 'rgb(236, 251, 253)',
        borderColor: 'rgb(236, 251, 253)',
        borderRadius: '8px',
        padding: '12px',
      }}
      {...rest}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
        }}>
        {t('router.domain.setup.tipStart')}
        {domain && (
          <Box
            sx={{
              mx: 0.5,
              color: 'primary.main',
              fontWeight: 'fontWeightBold',
            }}>
            {domain}
          </Box>
        )}
        {t('router.domain.setup.tipEnd')}:
      </Box>
      <Stack
        sx={{
          gap: 0.5,
          '&>div': { mb: 0 },
          marginTop: '12px',
        }}>
        <Tip label={t('router.domain.setup.recordType')} value="CNAME" locale={locale} />
        <Tip label={t('router.domain.setup.recordValue')} value={resolvedTarget} locale={locale} />
      </Stack>
    </Box>
  );
}

DNSTip.propTypes = {
  domain: PropTypes.string,
  resolvedTarget: PropTypes.string.isRequired,
};

function Tip({ locale, label, value }) {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const theme = useTheme();

  return (
    <InfoRow name={label} nameWidth={120}>
      <Box sx={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
        <Typography
          component="span"
          sx={[
            {
              color: 'primary.main',
              overflow: 'auto',
            },
            isMobile ? { maxWidth: '95%', wordWrap: 'break-word' } : { wordWrap: 'break-word' },
          ]}>
          {value}
        </Typography>

        <CopyButton
          content={value}
          locale={locale}
          style={{ marginLeft: '4px', color: theme.palette.text.secondary }}
        />
      </Box>
    </InfoRow>
  );
}

Tip.propTypes = {
  locale: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};
