/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import GroupIcon from '@mui/icons-material/Group';
import GroupRemoveIcon from '@mui/icons-material/GroupRemove';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, TextField, MenuItem } from '@mui/material';
import ArrowDownwardIcon from '@arcblock/icons/lib/ArrowDown';

import AccessConfig from '../../who-can-access/config';

export default function FormAccessRoleInput({ value, onChange, ...props }) {
  const CONFIG_ROLE = 'roles';
  const CONFIG_ROLE_REVERSE = 'roles_reverse';
  const { t, locale } = useLocaleContext();

  // NOTICE: 此处先保持原有结构，仅提供中/英文的配置项描述
  const Configs = [
    ...AccessConfig,
    {
      value: CONFIG_ROLE,
      icon: GroupIcon,
      title: {
        zh: '指定通行证可访问',
        en: 'Accessible to selected passports',
      },
      description: {
        zh: '只有指定的通行证可以访问',
        en: 'Only specified passports can access',
      },
    },
    {
      value: CONFIG_ROLE_REVERSE,
      icon: GroupRemoveIcon,
      title: {
        zh: '指定通行证不可以访问',
        en: 'Accessible to not selected passports',
      },
      description: {
        zh: '只有指定的通行证不可以访问',
        en: "Only specified passports can't access",
      },
    },
  ];

  return (
    <TextField
      {...props}
      label={t('blocklet.config.access.description')}
      select
      fullWidth
      value={value}
      onChange={onChange}
      sx={{
        '& .MuiInputBase-input': {
          width: 'calc(100% - 46px)',
          '& > .MuiBox-root:first-of-type': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        },
      }}
      slotProps={{
        select: {
          renderValue: (selected) => {
            const d = Configs.find((x) => x.value === selected);
            return d ? (
              <Box>
                <Box
                  component={d.icon}
                  sx={{
                    mr: 1,
                    fontSize: 18,
                    verticalAlign: 'text-bottom',
                    color: 'text.secondary',
                  }}
                />
                {d.title[locale] || d.title.en}
              </Box>
            ) : null;
          },
          // eslint-disable-next-line react/no-unstable-nested-components
          IconComponent: (iconProps) => <ArrowDownwardIcon {...iconProps} width={20} height={20} />,
        },
      }}>
      {Configs.map((d) => {
        return (
          <MenuItem
            value={d.value}
            sx={{
              display: 'block',
              '& .tip': {
                fontSize: '12px',
                color: `${({ theme }) => theme.palette.text.secondary}`,
              },
            }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}>
              <Box
                component={d.icon}
                sx={{
                  mr: 1,
                  fontSize: 18,
                  verticalAlign: 'text-bottom',
                  color: 'text.secondary',
                }}
              />
              <Box>{d.title[locale] || d.title.en}</Box>
            </Box>
            <Box className="tip">{d.description[locale] || d.description.en}</Box>
          </MenuItem>
        );
      })}
    </TextField>
  );
}

FormAccessRoleInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};
