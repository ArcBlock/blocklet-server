import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import Switch from '@arcblock/ux/lib/Switch';
import { useState, useEffect } from 'react';
import { useMemoizedFn } from 'ahooks';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import { formatError } from '@blocklet/error';

import { sdkClient } from '../../../util';

function Privacy({ configList, onSave }) {
  const [dataList, setDataList] = useState(configList);

  const { t } = useLocaleContext();

  const handleChangeSwitch = useMemoizedFn(async (type, value) => {
    try {
      const result = await sdkClient.user.saveUserPrivacyConfig({
        [type]: typeof value === 'string' ? value : !value,
      });

      setDataList(
        dataList.map((item) => {
          return {
            ...item,
            value: result?.[item.key] ?? item.value,
          };
        })
      );
      Toast.success(t('userCenter.saveSuccess'));
      onSave('privacy');
    } catch (err) {
      Toast.error(formatError(err));
    }
  });

  useEffect(() => {
    setDataList(configList);
  }, [configList]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        alignItems: 'start',
        '.MuiFormControlLabel-root': {
          gap: 1,
          m: 0,
          flexDirection: {
            xs: 'row-reverse',
            md: 'row',
          },
          width: {
            xs: '100%',
            md: 'unset',
          },
        },

        '.MuiSwitch-track': {
          borderRadius: '100vw',
        },
        '.MuiSwitch-thumb': {
          borderRadius: '100%',
        },
        '.MuiSwitch-root.MuiSwitch-sizeSmall': {
          height: '20px',
          width: '36px',
          '.MuiSwitch-thumb': {
            width: '16px',
            height: '16px',
          },
        },
      }}>
      {dataList.map((item) => {
        if (item.isPrivate) {
          return null;
        }
        const isPublic = !item.value || ['all', 'follower-only'].includes(item.value);
        return (
          <Box>
            <Switch
              key={item.key}
              checked={isPublic}
              labelProps={{
                label: (
                  <Typography
                    sx={{
                      color: 'text.primary',
                      fontSize: 14,
                      display: 'flex',
                      flexFlow: 'wrap',
                      columnGap: 1,
                      flex: 1,
                    }}>
                    {t('userCenter.toPublic', { name: item.name })}
                  </Typography>
                ),
              }}
              size="small"
              onChange={(event) => {
                const { checked } = event.target;
                if (item.followersOnly) {
                  handleChangeSwitch(item.key, checked ? 'all' : 'private');
                } else {
                  handleChangeSwitch(item.key, checked);
                }
              }}
            />
            {item.followersOnly && isPublic && (
              <Box sx={{ pl: 3, pt: 1 }}>
                <Switch
                  checked={item.value === 'follower-only'}
                  labelProps={{
                    label: (
                      <Typography
                        sx={{
                          color: 'text.primary',
                          fontSize: 14,
                          display: 'flex',
                          flexFlow: 'wrap',
                          columnGap: 1,
                          flex: 1,
                        }}>
                        {t('team.userFollowers.followersOnly')}
                      </Typography>
                    ),
                  }}
                  size="small"
                  onChange={(event) => {
                    const { checked } = event.target;
                    handleChangeSwitch(item.key, checked ? 'follower-only' : 'all');
                  }}
                />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

Privacy.propTypes = {
  configList: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      value: PropTypes.bool.isRequired,
      isPrivate: PropTypes.bool,
    })
  ).isRequired,
  onSave: PropTypes.func.isRequired,
};

export default Privacy;
