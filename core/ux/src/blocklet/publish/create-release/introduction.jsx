import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Box, InputAdornment, Tab, Tabs, TextField, Typography } from '@mui/material';
import { PROJECT } from '@blocklet/constant';
import IntroductionPreview from './introduction-preview';

function Introduction({ params, setParams, paramsErrTip, loading, setParamsErrTip, readOnly }) {
  const { t } = useLocaleContext();
  const [nowTab, setNowTab] = useState(readOnly ? 'preview' : 'write');
  const handleChange = (_, newValue) => {
    setNowTab(newValue);
  };

  return (
    <Box
      sx={{
        border: '1px solid transparent',
        borderRadius: 2,
      }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
          }}>
          {t('common.introduction')}
        </Typography>
        <Tabs value={nowTab} onChange={handleChange} aria-label="wrapped label tabs example">
          <Tab value="write" label="Write" />
          <Tab value="preview" label="Preview" />
        </Tabs>
      </Box>
      {/* <Box sx={{ height: '1px', width: '100%', background: '#eee' }} /> */}
      <Box
        sx={{
          display: nowTab === 'write' ? 'block' : 'none',
          width: '100%',
          marginTop: 3,
        }}>
        <TextField
          disabled={loading || readOnly}
          sx={{ border: 'none' }}
          // label={`Blocklet ${t('common.introduction')}`}
          placeholder={`Blocklet ${t('common.introduction')}`}
          autoComplete="off"
          variant="outlined"
          fullWidth
          multiline
          minRows={4}
          value={params.blockletIntroduction || ''}
          onChange={(e) => {
            setParamsErrTip({ blockletIntroduction: '' });
            setParams({ blockletIntroduction: e.target.value.slice(0, PROJECT.MAX_INTRO_LENGTH) });
          }}
          error={!!paramsErrTip.blockletIntroduction}
          helperText={paramsErrTip.blockletIntroduction || ''}
          slotProps={{
            input: {
              'data-cy': 'export-blocklet-introduction',
              readOnly,
              endAdornment: (
                <InputAdornment position="end">
                  {params?.blockletIntroduction?.length || 0} / {PROJECT.MAX_INTRO_LENGTH}
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      <Box
        sx={{
          display: nowTab === 'preview' ? 'block' : 'none',
          mt: 3,
        }}>
        <IntroductionPreview text={params.blockletIntroduction || ''} />
      </Box>
    </Box>
  );
}

Introduction.propTypes = {
  params: PropTypes.object.isRequired,
  setParams: PropTypes.func.isRequired,
  paramsErrTip: PropTypes.object.isRequired,
  setParamsErrTip: PropTypes.func.isRequired,
  readOnly: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default Introduction;
