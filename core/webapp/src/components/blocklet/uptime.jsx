import { useContext } from 'react';
import PropTypes from 'prop-types';
import prettyMs from 'pretty-ms-i18n';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

import { formatLocale } from '../../libs/util';
import UpTime from '../uptime';

export default function BlockletUpTime({ startAt = 0 }) {
  const { t, locale } = useContext(LocaleContext);

  return (
    <UpTime
      initialTime={+new Date() - startAt}
      format={prettyT => {
        if (prettyT < 1000 * 60) {
          return `${t('blocklet.initialUptime')}`;
        }

        const options = { compact: true, locale: formatLocale(locale), secondsDecimalDigits: 60 };

        return prettyMs(prettyT, options);
      }}
    />
  );
}

BlockletUpTime.propTypes = {
  startAt: PropTypes.number,
};
