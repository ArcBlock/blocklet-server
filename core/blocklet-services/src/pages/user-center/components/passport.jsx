import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import Empty from '@arcblock/ux/lib/Empty';
import { useTheme } from '@arcblock/ux/lib/Theme';
import PassportItem from '@arcblock/ux/lib/Passport';
import { PASSPORT_STATUS } from '@arcblock/ux/lib/Util/constant';
import { useCreation } from 'ahooks';
import uniqBy from 'lodash/uniqBy';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { createPassportSvg } from '@abtnode/ux/lib/util/passport';

function Passport({ user, ...rest }) {
  const { t } = useLocaleContext();
  const theme = useTheme();
  const passports = useCreation(() => {
    const passportList = (user?.passports || []).map((x) => ({
      ...x,
      revoked: x.status === PASSPORT_STATUS.REVOKED,
    }));
    passportList.sort((a, b) => {
      if (a.revoked === b.revoked) {
        return 0;
      }
      if (a.revoked) {
        return 1;
      }
      return -1;
    });

    return uniqBy(
      passportList.filter((x) => !x.display),
      'role'
    ).concat(
      uniqBy(
        passportList.filter((x) => x.display),
        'display.content'
      )
    );
  }, [user?.passports]);

  const currentRole = useCreation(() => passports?.find((item) => item.name === user.role), [passports, user?.role]);
  const activeColor = theme.palette.primary.main;

  if (passports.length === 0) {
    return (
      <Box>
        <Empty>{t('userCenter.noPassport')}</Empty>
      </Box>
    );
  }

  return (
    <Box
      {...rest}
      sx={{
        display: 'grid',
        justifyItems: 'start',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(5, 1fr)',
        },
        gap: 2.5,
        ...rest.sx,
      }}>
      {passports.map((x) => (
        <PassportItem
          key={x.id}
          passport={x}
          user={user}
          color={window.blocklet.passportColor}
          createPassportSvg={createPassportSvg}
          title={currentRole && currentRole.role === x.role ? t('userCenter.currentPassport') : ''}
          sx={{
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            '.passport-item__display': {
              width: 166,
              height: 166,
              borderRadius: 1,
              px: 2,
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: 'grey.50',
              boxShadow:
                currentRole && currentRole.role === x.role
                  ? `0px 2px 4px 0px ${activeColor}, 0px 1px 2px -1px ${activeColor}, 0px 0px 0px 1px ${activeColor} !important`
                  : 'unset',
            },
            '.passport-item__body': {
              marginLeft: '0 !important',
            },
          }}
        />
      ))}
    </Box>
  );
}

Passport.propTypes = {
  user: PropTypes.object.isRequired,
};

export default Passport;
