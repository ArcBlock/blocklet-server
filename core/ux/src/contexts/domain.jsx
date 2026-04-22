import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import trim from 'lodash/trim';
import { createContext, useContext } from 'react';
import useSetState from 'react-use/lib/useSetState';

import { validateDomain } from '../util';

const DomainContext = createContext({});
const { Provider, Consumer } = DomainContext;

// eslint-disable-next-line react/prop-types
function DomainProvider({ children }) {
  const [state, setState] = useSetState({
    domain: '',
    error: null,
  });
  const { locale } = useLocaleContext();

  const value = {
    error: state.error,
    domain: state.domain,
    setError: (error) => {
      setState({ error });
    },
    setDomain: (domain) => {
      const tmpDomain = trim(domain);

      const errMessage = validateDomain(tmpDomain, locale);

      setState({ domain: tmpDomain, error: errMessage });
    },
  };

  return <Provider value={{ value }}>{children}</Provider>;
}

function useDomainContext() {
  const { value } = useContext(DomainContext);
  return value;
}

export { Consumer as DomainConsumer, DomainContext, DomainProvider, useDomainContext };
