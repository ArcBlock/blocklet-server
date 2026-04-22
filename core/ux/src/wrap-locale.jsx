/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/no-extraneous-dependencies */
import { LocaleProvider } from '@arcblock/ux/lib/Locale/context';

import { translations } from './locales';

export default function wrapLocale(Component) {
  return function LocaleWrapper(props) {
    return (
      <LocaleProvider translations={translations}>
        <Component {...props} />
      </LocaleProvider>
    );
  };
}
