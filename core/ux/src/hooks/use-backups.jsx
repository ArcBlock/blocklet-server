import { useMemo, useState } from 'react';
import debounce from 'lodash/debounce';
import { useAsyncEffect } from 'ahooks';
import toast from '@arcblock/ux/lib/Toast';
import dayjs from '@abtnode/util/lib/dayjs';
import { useNodeContext } from '../contexts/node';
import { useBlockletContext } from '../contexts/blocklet';
import { formatError } from '../util';

/**
 * @description
 * @param {{ deps: any[], setLoading: (bool: boolean) => void }} { deps }
 * @return {{ backups: import('@blocklet/server-js').Backup[] }}
 */
export default function useBackups(
  { deps, setLoading, backupDate } = { deps: [], setLoading: () => undefined, backupDate: new Date() }
) {
  /** @type {{ blocklet: import('@blocklet/server-js').BlockletState }} */
  const { blocklet } = useBlockletContext();
  const [backups, setBackups] = useState([]);
  const { api } = useNodeContext();

  const [startTime, endTime] = useMemo(() => {
    if (!backupDate) {
      return [dayjs().startOf('year').toISOString(), dayjs().endOf('day').toISOString()];
    }
    return [dayjs(backupDate).startOf('day').toISOString(), dayjs(backupDate).endOf('day').toISOString()];
  }, [backupDate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchBackups = debounce(async () => {
    try {
      setLoading(true);
      if (!blocklet) {
        setBackups([]);
        return;
      }

      const { backups: data } = await api.getBlockletBackups({
        input: {
          did: blocklet.meta.did,
          startTime,
          endTime,
        },
      });
      setBackups(data ?? []);
    } catch (error) {
      console.error(error);
      toast.error(formatError(error));
    } finally {
      setLoading(false);
    }
  }, 1000);

  // eslint-disable-next-line require-await
  useAsyncEffect(async () => {
    fetchBackups();
  }, [blocklet?.meta?.did].concat(deps));

  return { backups };
}
