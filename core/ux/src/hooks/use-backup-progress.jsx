import { useEffect, useState } from 'react';
import { BlockletEvents } from '@blocklet/constant';
import isNull from 'lodash/isNull';
import { useNodeContext } from '../contexts/node';
import useBackups from './use-backups';

/**
 * @typedef {{
 *  appDid:    string;
 *  meta:      { did: string };
 *  message:   string;
 *  progress:  number;
 *  completed: boolean;
 * }} EventData
 */

/**
 * @description 实时显示备份的进度
 * @param {{appDid: string}} {appDid}
 * @return {{message: string, progress: number, completed: boolean}}
 */
function useBackupProgress({ appDid }) {
  const { backups } = useBackups();
  const [progress, setProgress] = useState({
    message: '',
    progress: 0,
    completed: false,
  });
  const node = useNodeContext();
  const {
    ws: { useSubscription },
  } = node;

  useSubscription(
    BlockletEvents.backupProgress,
    /**
     *
     * @param {EventData} data
     */
    (data) => {
      if (appDid === data?.appDid) {
        setProgress(() => ({
          ...data,
        }));
      }
    },
    [appDid]
  );

  useEffect(() => {
    // @note: isNull(backups[0]?.status) 表示正在备份中...
    if (backups?.length && isNull(backups[0]?.status)) {
      const [backup] = backups;
      setProgress(() => ({
        message: backup.message,
        progress: backup.progress,
        // @note: backup.progress 可能是一个浮点型
        completed: Boolean(backup.progress >= 100),
      }));
    }
  }, [backups]);

  return progress;
}

export default useBackupProgress;
