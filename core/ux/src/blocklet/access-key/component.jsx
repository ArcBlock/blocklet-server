import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import { RBAC_CONFIG, ROLES } from '@abtnode/constant';
import { uniqBy } from 'lodash';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useMemo } from 'react';
import ArrowDownwardIcon from '@arcblock/icons/lib/ArrowDown';

import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';

function ExpiredAt({ value }) {
  const { t, locale } = useLocaleContext();
  const now = new Date();
  const expiredAt = new Date(value);
  const isExpired = expiredAt < now;

  if (isExpired) {
    return (
      <span style={{ color: 'red' }}>
        <RelativeTime value={value} locale={locale} />
        {`${t('setting.accessKey.expired', { time: '' })}`}
      </span>
    );
  }
  return <RelativeTime mode="daysLeft" value={value} locale={locale} type="all" />;
}

ExpiredAt.propTypes = {
  value: PropTypes.string.isRequired,
};

function AuthType({ value, onChange, ...rest }) {
  const { t } = useLocaleContext();

  const list = useMemo(() => {
    return [
      {
        value: 'signature',
        title: t('setting.accessKey.signature'),
        description: t('setting.accessKey.signatureDesc'),
      },
      {
        value: 'simple',
        title: t('setting.accessKey.simple'),
        description: t('setting.accessKey.simpleDesc'),
      },
    ];
  }, [t]);

  return (
    <FormControl style={{ width: '100%' }} variant="outlined" {...rest}>
      <InputLabel>{t('setting.accessKey.authType')}</InputLabel>
      <Select
        value={value}
        onChange={onChange}
        fullWidth
        label={t('setting.accessKey.authType')}
        // eslint-disable-next-line react/no-unstable-nested-components
        IconComponent={(props) => <ArrowDownwardIcon {...props} width={20} height={20} />}>
        {list.map((item) => {
          return (
            <MenuItem key={item.value} value={item.value}>
              <Box>
                <span>{item.title}</span>
                <Box
                  sx={{
                    maxWidth: 510,
                    fontSize: 12,
                    color: '#999',
                    whiteSpace: 'normal',
                  }}>
                  {item.description}
                </Box>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}

AuthType.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const useRoles = () => {
  const SERVER_ROLES = RBAC_CONFIG.roles.filter((x) => x.passport);

  const { inService } = useNodeContext();
  const { roles: teamRoles } = useTeamContext();

  const roles = [...SERVER_ROLES, ...(inService ? teamRoles : [])];
  return uniqBy(roles, 'name').filter((x) => x.name !== ROLES.OWNER);
};

export { ExpiredAt, useRoles, AuthType };
