import React from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';

import PropTypes from 'prop-types';
import { PROJECT } from '@blocklet/constant';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

function Version({ readOnly, params, setParams, paramsErrTip, setParamsErrTip, loading }) {
  const { t } = useLocaleContext();

  return (
    <Box
      className="section"
      sx={{
        display: 'flex',
        mt: 3,
      }}>
      <Box sx={{ flex: 1 }}>
        <TextField
          required
          disabled={loading || readOnly}
          label={`Blocklet ${t('common.version')}`}
          placeholder={`Blocklet ${t('common.version')}`}
          autoComplete="off"
          variant="outlined"
          fullWidth
          value={params.blockletVersion || ''}
          onChange={(e) => {
            setParamsErrTip({ blockletVersion: '' });
            setParams({ blockletVersion: e.target.value });
          }}
          error={!!paramsErrTip.blockletVersion}
          helperText={paramsErrTip.blockletVersion || ''}
          slotProps={{
            input: {
              'data-cy': 'blocklet-version',
              readOnly,
            },
          }}
        />
        <TextField
          label={t('blocklet.publish.releaseNote')}
          autoComplete="off"
          disabled={loading || readOnly}
          variant="outlined"
          fullWidth
          multiline
          minRows={4}
          required
          value={params.note || ''}
          onChange={(e) => {
            setParamsErrTip({ note: '' });
            setParams({ note: e.target.value.slice(0, PROJECT.MAX_NOTE_LENGTH) });
          }}
          error={!!paramsErrTip.note}
          helperText={paramsErrTip.note || ''}
          sx={{ mt: 3 }}
          slotProps={{
            input: {
              'data-cy': 'release-note',
              readOnly,
              endAdornment: (
                <InputAdornment position="end">
                  {params?.note?.length || 0} / {PROJECT.MAX_NOTE_LENGTH}
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
    </Box>
  );
}

Version.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  params: PropTypes.object.isRequired,
  setParams: PropTypes.func.isRequired,
  paramsErrTip: PropTypes.object.isRequired,
  setParamsErrTip: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default Version;
