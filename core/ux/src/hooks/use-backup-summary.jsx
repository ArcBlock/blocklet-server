/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable import/prefer-default-export */
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { useAsyncEffect } from 'ahooks';
import toast from '@arcblock/ux/lib/Toast';
import dayjs from '@abtnode/util/lib/dayjs';
import { useNodeContext } from '../contexts/node';
import { useBlockletContext } from '../contexts/blocklet';
import { formatError } from '../util';

/**
 * 获取备份摘要数据的自定义Hook
 *
 * @param {Object} options - 配置选项
 * @param {Array} options.deps - 额外的依赖数组，当这些依赖变化时重新获取数据
 * @param {Function} options.setLoading - 设置加载状态的回调函数
 * @return {Object} 返回备份摘要数据
 */
export function useBackupSummary({ deps = [], setLoading = () => {} } = {}) {
  const { blocklet } = useBlockletContext();
  const [backupSummary, setBackupSummary] = useState([]);
  /** @type {{ api: import('@blocklet/server-js')}} */
  const { api } = useNodeContext();

  // 使用useCallback包装fetchBackups函数以避免不必要的重新创建
  const fetchBackups = useCallback(
    debounce(async () => {
      if (!api || !blocklet?.meta?.did) {
        setBackupSummary([]);
        return;
      }

      try {
        setLoading(true);

        // 使用dayjs计算时间范围
        const endTime = dayjs();
        const startTime = endTime.subtract(1, 'year');

        const { summary: data } = await api.getBlockletBackupSummary({
          input: {
            did: blocklet.meta.did,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          },
        });
        // @note: 尽管我定义了完美的 GQL 类型，但是线上环境返回的 successCount, errorCount 都是字符串，所以需要转换为数字。 relates: https://team.arcblock.io/comment/discussions/256d31c6-e155-4298-937e-73bb21046b31
        const summary = Array.isArray(data)
          ? data.map((x) => {
              return {
                ...x,
                successCount: +x.successCount,
                errorCount: +x.errorCount,
              };
            })
          : [];

        setBackupSummary(summary);
      } catch (error) {
        console.error('Failed to fetch backup summary:', error);
        toast.error(formatError(error));
        setBackupSummary([]);
      } finally {
        setLoading(false);
      }
    }, 1000),
    []
  );

  // 使用useAsyncEffect执行异步操作
  useAsyncEffect(async () => {
    await fetchBackups();

    // 返回清理函数
    return () => {
      fetchBackups.cancel();
    };
  }, [blocklet?.meta?.did].concat(deps));

  return { backupSummary };
}
