/* eslint-disable prettier/prettier */
import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import upperFirst from 'lodash/upperFirst';

import Box from '@mui/material/Box';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import NFTDisplay from '@arcblock/ux/lib/NFTDisplay';
import RevokeIcon from '@arcblock/icons/lib/RevokeIcon';
import { formatToDatetime } from '../../util';

export default function PassportItem({
  passport,
  user,
  color,
  width = 150,
  icon = null,
  children = null,
  createPassportSvg,
  ...rest
}) {
  const { t, locale } = useLocaleContext();
  return (
    <Root display="flex" alignItems="center" {...rest}>
      {!!passport.display && (
        <div className="passport-item__display" style={{ width }}>
          <NFTDisplay
            address={passport.id}
            data={passport.display}
            style={{ width: '100%' }}
            imageFilter={typeof width === 'number' ? { imageFilter: 'resize', w: width } : null}
          />
        </div>
      )}
      {!passport.display && (
        <div
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: createPassportSvg({
              scope: passport.scope,
              role: passport.role,
              title: passport.scope === 'kyc' ? passport.name : passport.title,
              issuer: passport.issuer && passport.issuer.name,
              issuerDid: passport.issuer && passport.issuer.id,
              ownerName: user.fullName,
              ownerDid: user.did,
              ownerAvatarUrl: user.avatar,
              revoked: passport.revoked,
              preferredColor: color,
              width,
              extra: passport.scope === 'kyc' ? { key: 'Email', value: passport.name } : undefined,
            }),
          }}
        />
      )}
      <div className="body">
        <Box
          className="title"
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}>
          {upperFirst(passport.title)}
          <div className="status-icons">
            {icon}
            {passport.revoked && <RevokeIcon />}
          </div>
        </Box>
        {passport.issuanceDate && (
          <Box
            className="title"
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}>
            {t('team.passport.issuanceDate', { date: formatToDatetime(passport.issuanceDate, locale) })}
          </Box>
        )}
        {passport.expirationDate && (
          <Box
            className="title"
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}>
            {t('team.passport.validUntil', { date: formatToDatetime(passport.expirationDate, locale) })}
          </Box>
        )}
        {children}
      </div>
    </Root>
  );
}

PassportItem.propTypes = {
  passport: PropTypes.any.isRequired,
  user: PropTypes.any.isRequired,
  color: PropTypes.string.isRequired,
  createPassportSvg: PropTypes.func.isRequired,
  icon: PropTypes.any,
  children: PropTypes.any,
  width: PropTypes.number,
};

const Root = styled(Box)`
  .body {
    padding: 0;
    margin-left: 24px;
    margin-top: 0;
  }
  .title {
    font-weight: 400;
    font-size: 16px;
    line-height: 19px;
    color: ${({ theme }) => theme.palette.text.primary};
    margin-bottom: 8px;
  }
  .tip {
    display: flex;
    align-items: center;
    font-size: 14px;
    margin-top: 6px;
    color: ${({ theme }) => theme.palette.text.secondary};
  }
  .status-icons {
    svg {
      fill: ${({ theme }) => theme.palette.text.secondary};
      height: 1.2em;
      margin-left: 0.4em;
    }
  }
`;
