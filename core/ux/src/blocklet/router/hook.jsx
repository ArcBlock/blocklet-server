import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import { formatError } from '@blocklet/error';
import { useNodeContext } from '../../contexts/node';
import { useBlockletContext } from '../../contexts/blocklet';
import Confirm from '../../../lib/confirm';

const ConflictDomainContext = createContext();

// eslint-disable-next-line react/prop-types
export function ConflictDomainProvider({ children }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const [conflict, setConflict] = useState(null);

  const checkConflict = useCallback(
    async (domain, onConfirm) => {
      try {
        const data = await api.getBlocklet({ input: { domain, did: blocklet?.meta?.did } });
        if (!data?.blocklet) return false;

        return new Promise((resolve) => {
          setConflict({
            title: t('setting.domain.conflictTitle', { domain }),
            description: t('setting.domain.conflictDescription', {
              domain,
              title: data.blocklet.meta?.title,
              from: data.blocklet.meta?.title,
              to: blocklet.meta?.title,
            }),
            confirm: t('common.confirm'),
            cancel: t('common.cancel'),
            onConfirm: async () => {
              setConflict(null);
              await onConfirm?.();
              resolve(true);
            },
            onCancel: () => {
              setConflict(null);
              resolve(false);
            },
          });
        });
      } catch (error) {
        console.error(error);
        Toast.error(formatError(error));
        return false;
      }
    },
    [api, t, blocklet]
  );

  const render = useCallback(() => {
    if (!conflict) return null;
    return (
      <Confirm
        title={conflict.title}
        description={conflict.description}
        confirm={conflict.confirm}
        cancel={conflict.cancel}
        onConfirm={conflict.onConfirm}
        onCancel={conflict.onCancel}
      />
    );
  }, [conflict]);

  const value = useMemo(() => ({ checkConflict }), [checkConflict]);

  return (
    <ConflictDomainContext.Provider value={value}>
      {children}
      {render()}
    </ConflictDomainContext.Provider>
  );
}

export function useConflictDomain() {
  return useContext(ConflictDomainContext);
}
