import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNodeContext } from '../contexts/node';

function parseBlockletMetaUrl(meta) {
  return meta && meta.registryUrl && meta.did ? `${meta.registryUrl}/api/blocklets/${meta?.did}/blocklet.json` : '';
}

function useComponentsByBlockletMetaUrl(meta) {
  const { api } = useNodeContext();
  const [params] = useSearchParams();
  const blockletMetaUrl = params.get('blocklet_meta_url') || parseBlockletMetaUrl(meta);

  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!blockletMetaUrl || meta?.inputUrl) {
      return;
    }
    setLoading(true);
    api
      .getDynamicComponents({ input: { url: blockletMetaUrl } })
      .then((res) => {
        setComponents(res.components);
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockletMetaUrl]);

  return { components, loading };
}

export default useComponentsByBlockletMetaUrl;
