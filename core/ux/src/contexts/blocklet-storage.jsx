import { createContext, useContext, useMemo, useState } from 'react';
import propTypes from 'prop-types';
import toast from '@arcblock/ux/lib/Toast';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import isUndefined from 'lodash/isUndefined';
import { useBlockletContext } from './blocklet';
import { getSpaceBackupEndpoint } from '../util/spaces';
import useSpaceGateways from '../hooks/use-space-gateways';
import { useNodeContext } from './node';
import useBackupProgress from '../hooks/use-backup-progress';
import useBackups from '../hooks/use-backups';
import { useBackupSummary } from '../hooks/use-backup-summary';

/**
 * @typedef {import('../blocklet/did-spaces/backup/connected').SpaceGateway} SpaceGateway
 * @typedef {import('@blocklet/server-js').Backup} Backup
 * @typedef {import('@blocklet/server-js').AutoBackup} AutoBackup
 * @typedef {{
 *  message: string;
 *  progress: number;
 *  completed: false | true,
 * }} BackupProgress
 */

/**
 * @typedef {{
 *  spaceGateways: SpaceGateway[],
 *  selectedGateway: SpaceGateway,
 *  addSpaceGateway: (spaceGateway: SpaceGateway) => Promise<void>,
 *  deleteSpaceGateway: (spaceGateway: SpaceGateway) => Promise<void>,
 *  updateSpaceGateway: (spaceGateway: SpaceGateway) => Promise<void>,
 *  refreshSpaceGateways: () => void,
 *  refreshBackups: () => void,
 *  spaceGatewaysLoading: boolean,
 *  spaceGatewaysFirstLoading: boolean,
 *  spaceGatewayIsSelected: (spaceGateway: SpaceGateway) => boolean,
 *  updateAutoBackup: (autoBackup: { enabled: boolean }) => Promise<void>,
 *  backupEndpoint: string,
 *  backupProgress: BackupProgress,
 *  backups: Backup[],
 *  backupSummary: Array<{date: string, successCount: number, errorCount: number}>,
 *  backupDate: string | null,
 *  setBackupDate: (date: string | null) => void,
 *  backupsLoading: boolean,
 *  autoBackup: AutoBackup,
 * }} BlockletStorageContextType
 */

/** @type {import('react').Context<BlockletStorageContextType>} */
const BlockletStorageContext = createContext({});
const { Provider, Consumer } = BlockletStorageContext;

function BlockletStorageProvider({ children }) {
  const { t } = useLocaleContext();
  /** @type {{ api: import('@blocklet/server-js') }} */
  const { api } = useNodeContext();
  /** @type {{ blocklet: import('@blocklet/server-js').BlockletState }} */
  const { blocklet } = useBlockletContext();
  const [backupDate, setBackupDate] = useState(null);

  const [spaceGatewaysRefresh, setSpaceGatewaysRefresh] = useState(false);
  const {
    data: spaceGateways,
    loading: spaceGatewaysLoading,
    mutate: mutateSpaceGateways,
  } = useSpaceGateways({
    refresh: spaceGatewaysRefresh,
  });
  const spaceGatewaysFirstLoading = isUndefined(spaceGateways);
  const backupProgress = useBackupProgress({ appDid: blocklet?.appDid });

  const backupEndpoint = useMemo(() => getSpaceBackupEndpoint(blocklet?.environments), [blocklet?.environments]);

  const [backupsLoading, setBackupsLoading] = useState(false);
  const [backupsRefresh, setBackupsRefresh] = useState(0);
  const { backups } = useBackups({
    deps: [backupsRefresh, backupDate],
    setLoading: setBackupsLoading,
    backupDate,
  });
  const [backupSummaryRefresh, setBackupSummaryRefresh] = useState(0);
  const { backupSummary } = useBackupSummary({
    deps: [backupSummaryRefresh],
  });
  const [selectedSpaceGateway, setSelectedSpaceGateway] = useState(
    spaceGateways?.find((x) => x.endpoint === backupEndpoint)
  );
  const autoBackup = blocklet?.settings?.autoBackup;

  const refreshSpaceGateways = () => {
    setSpaceGatewaysRefresh((p) => !p);
  };

  const refreshBackupSummary = () => {
    setBackupSummaryRefresh((p) => p + 1);
  };

  const refreshBackups = () => {
    setBackupsRefresh((p) => p + 1);
  };

  /**
   * @description
   * @param {AutoBackup} value
   */
  const updateAutoBackup = async (value) => {
    await api.updateAutoBackup({
      input: {
        did: blocklet.meta.did,
        autoBackup: value,
      },
    });
  };

  const abortBlockletBackup = async () => {
    await api.abortBlockletBackup({
      input: {
        appPid: blocklet.meta.did,
      },
    });
  };

  /**
   * @description
   * @param {SpaceGateway} spaceGateway
   * @param {string} endpoint
   *
   */
  const addSpaceGateway = async (spaceGateway, endpoint) => {
    try {
      mutateSpaceGateways((prev) => {
        const newSpaceGateways = [...prev];
        newSpaceGateways.push({ ...spaceGateway, loading: true });
        return newSpaceGateways;
      });

      await api.addBlockletSpaceGateway({
        input: {
          did: blocklet.meta.did,
          spaceGateway,
        },
      });
      if (backupEndpoint !== endpoint) {
        await api.configBlocklet({
          input: {
            did: [blocklet.meta.did],
            configs: [
              {
                key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_BACKUP_ENDPOINT,
                value: endpoint,
              },
            ],
          },
        });
      }

      setSelectedSpaceGateway(spaceGateway);
      refreshSpaceGateways();

      toast.success(t('storage.spaces.connectedWithName', { name: spaceGateway?.name ?? 'DID Spaces' }));
    } catch (error) {
      console.error(error);
      mutateSpaceGateways((prev) => {
        const newSpaceGateways = [...prev];
        return newSpaceGateways.filter((x) => x.did !== spaceGateway.did);
      });

      throw error;
    }
  };

  /**
   * @description
   * @param {SpaceGateway} spaceGateway
   */
  const deleteSpaceGateway = async (spaceGateway) => {
    if (!spaceGateway) {
      return;
    }

    if (spaceGateway.endpoint === backupEndpoint) {
      await api.configBlocklet({
        input: {
          did: [blocklet.meta.did],
          configs: [
            {
              key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_BACKUP_ENDPOINT,
              value: '',
            },
          ],
        },
      });

      if (autoBackup?.enabled) {
        await updateAutoBackup({ enabled: false });
      }
    }

    await api.deleteBlockletSpaceGateway({
      input: {
        did: blocklet.meta.did,
        spaceGatewayDid: spaceGateway?.did,
      },
    });

    mutateSpaceGateways((prev) => {
      const newSpaceGateways = [...prev];
      newSpaceGateways.splice(newSpaceGateways.indexOf(spaceGateway), 1);
      return newSpaceGateways;
    });

    setSelectedSpaceGateway(spaceGateway);
    refreshSpaceGateways();
  };

  /**
   * @description
   * @param {SpaceGateway} spaceGateway
   */
  const updateSpaceGateway = async (spaceGateway) => {
    await Promise.all([
      api.updateBlockletSpaceGateway({
        input: {
          did: blocklet.meta.did,
          where: { did: spaceGateway.did },
          spaceGateway,
        },
      }),
      backupEndpoint !== spaceGateway.endpoint &&
        api.configBlocklet({
          input: {
            did: [blocklet.meta.did],
            configs: [
              {
                key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_BACKUP_ENDPOINT,
                value: spaceGateway.endpoint,
              },
            ],
          },
        }),
    ]);

    toast.success(t('storage.spaces.connectedWithName', { name: spaceGateway?.name ?? 'DID Spaces' }));

    refreshSpaceGateways();
  };

  /**
   * @description
   * @param {SpaceGateway} spaceGateway
   */
  const spaceGatewayIsSelected = (spaceGateway) => spaceGateway?.endpoint === backupEndpoint;

  return (
    <Provider
      value={{
        spaceGateways: spaceGateways || [],
        selectedSpaceGateway,
        addSpaceGateway,
        deleteSpaceGateway,
        updateSpaceGateway,
        refreshSpaceGateways,
        spaceGatewaysLoading,
        spaceGatewaysFirstLoading,
        spaceGatewayIsSelected,
        updateAutoBackup,

        abortBlockletBackup,

        backupEndpoint,
        backupProgress,
        backups,
        backupSummary,
        refreshBackupSummary,
        refreshBackups,
        setBackupDate,
        backupsLoading,
        autoBackup,
      }}>
      {children}
    </Provider>
  );
}

BlockletStorageProvider.propTypes = {
  children: propTypes.any.isRequired,
};

function useBlockletStorageContext() {
  const res = useContext(BlockletStorageContext);
  return res;
}

export {
  BlockletStorageContext,
  BlockletStorageProvider,
  Consumer as BlockletStorageConsumer,
  useBlockletStorageContext,
};
