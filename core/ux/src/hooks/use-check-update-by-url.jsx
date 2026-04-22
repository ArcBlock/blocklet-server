import { useEffect } from 'react';
import Toast from '@arcblock/ux/lib/Toast';
import { useNavigate } from 'react-router-dom';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import useEventListen from './use-event-listen';

export function dispatchCheckUpdate() {
  window.dispatchEvent(new CustomEvent('checkUpdate'));
}

function useCheckUpdateByUrl(event) {
  const navigate = useNavigate();
  const { t } = useLocaleContext();

  const handle = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkUpdate')) {
      params.delete('checkUpdate');
      navigate(params.toString());
      event();
      Toast.success(t('notification.checkingForUpdates'));
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(handle, []);
  useEventListen('checkUpdate', handle);
}

export default useCheckUpdateByUrl;
