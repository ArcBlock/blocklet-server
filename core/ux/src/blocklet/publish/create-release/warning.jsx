import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, Tooltip, Typography } from '@mui/material';
import PropTypes from 'prop-types';

function Warning({ errors, storeList, ...props }) {
  const { t } = useLocaleContext();
  return (
    <Box
      {...props}
      sx={[
        {
          color: 'warning.main',
          fontSize: '14px',
          border: '1px solid rgba(214, 164, 64, 0.34)',
          borderRadius: '4px',
          py: 2,
          px: 1.5,
          position: 'relative',
        },
        // eslint-disable-next-line react/prop-types
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 'bold',
          position: 'absolute',
          top: -10,
          left: 12,
          backgroundColor: 'white',
          px: 1,
          width: 'fit-content',
        }}>
        {t('blocklet.publish.storeRule.warning')}
      </Typography>
      {errors &&
        Object.entries(errors).map(([url, error]) => {
          const list = Object.values(error);
          const storeInfo = storeList.find((x) => x.url === url);
          return (
            list.length > 0 && (
              <Box key={url}>
                <Tooltip title={url}>
                  <Box component="span" sx={{ cursor: 'pointer' }}>
                    {storeInfo.name}
                  </Box>
                </Tooltip>
                {list.map((item) => (
                  <Box
                    component="li"
                    key={item}
                    sx={{
                      ml: 2,
                      wordBreak: true,
                    }}>
                    {item}
                  </Box>
                ))}
              </Box>
            )
          );
        })}
    </Box>
  );
}

Warning.propTypes = {
  errors: PropTypes.object.isRequired,
  storeList: PropTypes.array.isRequired,
};

export default Warning;
