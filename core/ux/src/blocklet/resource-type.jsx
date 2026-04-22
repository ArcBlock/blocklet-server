import { useMemo } from 'react';
import PropTypes from 'prop-types';
import uniq from 'lodash/uniq';
import upperFirst from 'lodash/upperFirst';
import Box from '@mui/material/Box';
import Tag from '@arcblock/ux/lib/Tag';

export default function ResourceType({ blocklet, ...rest }) {
  const types = useMemo(() => {
    return uniq((blocklet?.meta?.resources || []).map((x) => upperFirst(x.split('.').slice(-1)[0])).filter(Boolean));
  }, [blocklet]);

  const style = {
    color: '#FFF',
    backgroundColor: '#5B9BD5',
    marginRight: '4px',
  };

  return (
    <Box
      {...rest}
      sx={[
        {
          display: 'flex',
          mr: '-4px',
        },
        ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx]),
      ]}>
      {types.map((x) => (
        <Tag key={x} type="custom" style={style}>
          {x}
        </Tag>
      ))}
    </Box>
  );
}

ResourceType.propTypes = {
  blocklet: PropTypes.object.isRequired,
};
