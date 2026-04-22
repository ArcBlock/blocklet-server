/* eslint-disable react/no-danger */
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';

import createPassportSvg from '@abtnode/auth/lib/util/create-passport-svg';
import { getPassportColorFromDid } from '@arcblock/nft-display';
import { getDisplayName } from '@blocklet/meta/lib/util';

import ColorInput from './color-input';

import commonPropTypes from './common-prop-types';

export default function PassportInput({ editing, value, onChange, componentProps, ...rest }) {
  const { blocklet } = componentProps;
  const color = value === 'auto' ? getPassportColorFromDid(blocklet.appDid) : value;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}>
      <div
        style={{ width: 96, marginRight: 12 }}
        dangerouslySetInnerHTML={{
          __html: createPassportSvg({
            title: 'Owner',
            issuer: getDisplayName(blocklet),
            issuerDid: blocklet.appDid,
            ownerName: 'Your Name',
            ownerDid: blocklet.appDid,
            preferredColor: value || 'auto',
          }),
        }}
      />
      <ColorInput
        {...rest}
        editing={editing}
        value={editing ? color : value}
        onChange={onChange}
        componentProps={componentProps}
      />
    </Box>
  );
}

PassportInput.propTypes = {
  ...commonPropTypes,
  componentProps: PropTypes.shape({
    blocklet: PropTypes.object.isRequired,
  }).isRequired,
};
