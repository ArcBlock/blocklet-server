/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react/no-danger */
/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';

import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

import Alert from '@mui/material/Alert';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import ClickToCopy from './click-to-copy';
// import ShortenLabel from './blocklet/component/shorten-label';
import Confirm from './confirm';

export default function DeleteConfirm({
  title,
  description,
  confirmPlaceholder,
  cancel = '',
  confirm = 'Confirm',
  params: initialParams = {},
  onCancel = () => {},
  onConfirm,
  keyName,
}) {
  const { t } = useLocaleContext();

  const confirmSetting = {
    title: () => (
      <Box>
        {title}
        {/* <ShortenLabel sx={{ fontSize: '14px' }} maxLength={64}>{` (${keyName})`}</ShortenLabel> */}
      </Box>
    ),
    description: (params, setParams) => {
      const setValue = (value) => {
        // eslint-disable-next-line no-underscore-dangle
        setParams({ ...value, __disableConfirm: value.__disableConfirm });
      };

      return (
        <Box>
          <Alert severity="warning" style={{ width: '100%' }}>
            {t('common.notice')}
          </Alert>
          <Box sx={{ my: 3, b: { wordBreak: 'break-word' } }} dangerouslySetInnerHTML={{ __html: description }} />
          <Box style={{ marginBottom: 24 }}>
            {t('common.click')}：<ClickToCopy data-cy="click-copy">{keyName}</ClickToCopy>
          </Box>
          <Typography component="div">
            <TextField
              label={confirmPlaceholder}
              autoComplete="off"
              data-cy="delete-confirm-input"
              variant="outlined"
              fullWidth
              autoFocus
              value={params.inputVal}
              onChange={(e) => {
                setValue({ ...params, inputVal: e.target.value, __disableConfirm: keyName !== e.target.value });
              }}
            />
          </Typography>
        </Box>
      );
    },
    confirm,
    cancel,
    onConfirm,
    onCancel,
    params: {
      inputVal: '',
      __disableConfirm: true,
      ...initialParams,
    },
  };

  return (
    <Confirm
      title={confirmSetting.title}
      description={confirmSetting.description}
      confirm={confirmSetting.confirm}
      cancel={confirmSetting.cancel}
      params={confirmSetting.params}
      onConfirm={confirmSetting.onConfirm}
      onCancel={confirmSetting.onCancel}
    />
  );
}

DeleteConfirm.propTypes = {
  title: PropTypes.any.isRequired,
  keyName: PropTypes.any.isRequired,
  description: PropTypes.any.isRequired, // can be a function that renders different content based on params
  confirmPlaceholder: PropTypes.any.isRequired,
  cancel: PropTypes.string,
  confirm: PropTypes.string,
  params: PropTypes.object, // This object holds states managed in the dialog
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func.isRequired,
};
