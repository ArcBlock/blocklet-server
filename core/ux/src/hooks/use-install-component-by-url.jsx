import Toast from '@arcblock/ux/lib/Toast';
import { useNavigate } from 'react-router-dom';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useEffect, useMemo, useRef } from 'react';

function useGetInstallComponentByUrl({ blocklet, scrollToComponent } = { blocklet: null, scrollToComponent: false }) {
  const navigate = useNavigate();
  const { t } = useLocaleContext();
  const installDid = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const installMeta = useMemo(() => {
    if (!blocklet || !blocklet.optionalComponents) {
      return null;
    }
    const params = new URLSearchParams(window.location.search);
    const did = params.get('install-component');
    if (did) {
      installDid.current = did;
      params.delete('install-component');
      navigate(params.toString());
      const optionalComponent = blocklet.optionalComponents.find((x) => x.meta.did === did);
      if (!optionalComponent) {
        Toast.success(t('notification.installComponentError', { did }));
        return null;
      }
      const { meta } = optionalComponent;
      if (scrollToComponent) {
        const element = document.getElementById(`optional-component-${did}`);
        const scrollContainer = document.querySelector('.dashboard-main');
        if (element) {
          const elementRect = element.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();

          scrollContainer.scrollTo({
            top: elementRect.top - containerRect.top + scrollContainer.scrollTop,
            behavior: 'smooth',
          });
        }
      }

      return meta;
    }
    return null;
  }, [blocklet, navigate, t, scrollToComponent]);

  useEffect(() => {
    if (installDid.current && window.opener) {
      window.opener.postMessage({ blocklet, kind: 'component-installer' }, window.blocklet?.appUrl);
    }
  }, [blocklet]);

  return installMeta;
}

export default useGetInstallComponentByUrl;
