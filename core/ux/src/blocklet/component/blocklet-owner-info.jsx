import { Box } from '@mui/material';
import DID from '@arcblock/ux/lib/DID';
import PropTypes from 'prop-types';

export default function BlockletOwnerInfo({ owner, locale }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {owner.fullName}
      {owner.did ? (
        <DID
          sx={{
            lineHeight: 'initial',
            '&::before': {
              content: '"("',
            },
            '&::after': {
              content: '")"',
            },
          }}
          did={owner.did}
          compact
          size={14}
          locale={locale}
        />
      ) : null}
    </Box>
  );
}

BlockletOwnerInfo.propTypes = {
  owner: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
};
