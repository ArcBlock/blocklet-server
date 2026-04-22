import { useEffect, useState } from 'react';
import { useBlockletContext } from '../contexts/blocklet';
import { getDIDSpaceEndpoint } from '../util/spaces';

/**
 * @description
 * @export
 * @return {{
 *  storageEndpoint: string
 * }}
 */
export default function useStorageEndpoint() {
  const [storageEndpoint, setStorageEndpoint] = useState(null);
  const { blocklet } = useBlockletContext();

  useEffect(() => {
    setStorageEndpoint(getDIDSpaceEndpoint(blocklet));
  }, [blocklet]);

  return { storageEndpoint };
}
