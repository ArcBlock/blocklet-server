import { useState } from 'react';
import PropTypes from 'prop-types';

import Button from '@arcblock/ux/lib/Button';
import Typography from '@mui/material/Typography';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

export default function MatchedSites({ style = {}, certificate, ...restProps }) {
  const { t } = useLocaleContext();
  const [showMore, setShowMore] = useState(false);

  const sites = certificate.matchedSites || [];

  return (
    <Typography
      component="ul"
      {...restProps}
      style={{
        ...style,
        listStyle: 'none',
      }}>
      {(showMore ? sites : sites.slice(0, 4)).map(s => (
        <Typography component="li" key={s.id} style={{ fontSize: '1.1rem', margin: '4px 0' }}>
          {s.domain}
        </Typography>
      ))}
      {sites.length > 4 && (
        <Button
          style={{ border: 'none', padding: '5px 0' }}
          variant="outlined"
          color="primary"
          className="button"
          onClick={() => {
            setShowMore(!showMore);
          }}>
          {showMore ? t('common.collapseAll') : t('common.expandAll')}
        </Button>
      )}
    </Typography>
  );
}

MatchedSites.propTypes = {
  certificate: PropTypes.object.isRequired,
  style: PropTypes.object,
};
