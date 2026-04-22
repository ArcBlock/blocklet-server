import { Box, MenuItem, Select } from '@mui/material';
import PropTypes from 'prop-types';
import { useMemoizedFn, useReactive } from 'ahooks';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import Toast from '@arcblock/ux/lib/Toast';
import ArrowDownwardIcon from '@arcblock/icons/lib/ArrowDown';
import { formatError } from '@blocklet/error';

import { sdkClient } from '../../../util';

// TODO: 需要从后端获取
const languages = [
  { name: 'English', code: 'en' },
  { name: '中文', code: 'zh' },
];

function ConfigProfile({ user, onSave }) {
  const { t, changeLocale } = useLocaleContext();
  const currentState = useReactive({
    locale: user.locale,
    loading: false,
  });

  const handleChange = useMemoizedFn(async (e) => {
    try {
      const { value } = e.target;
      currentState.loading = true;
      await sdkClient.user.saveProfile({
        locale: value,
      });
      await onSave('profile');
      changeLocale(value);
      currentState.locale = value;
    } catch (err) {
      Toast.error(formatError(err));
    } finally {
      currentState.loading = false;
    }
  });
  return (
    <Box
      sx={{
        gap: 1,
        display: 'grid',
        alignItems: 'center',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'max-content 1fr',
        },
      }}>
      <Box>{t('userCenter.commonSetting.locale')}</Box>
      <Box>
        <Select
          value={currentState.locale}
          onChange={handleChange}
          size="small"
          // eslint-disable-next-line react/no-unstable-nested-components
          IconComponent={(props) => <ArrowDownwardIcon {...props} width={20} height={20} />}
          sx={{
            minWidth: 200,
            '&:hover': {
              'fieldset.MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              },
            },
            fieldset: {
              borderColor: 'divider',
            },
          }}>
          {(window.blocklet.languages || languages).map((x) => (
            <MenuItem value={x.code} key={x.code}>
              {x.name}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );
}

ConfigProfile.propTypes = {
  user: PropTypes.shape({
    locale: PropTypes.string,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
};

export default ConfigProfile;
