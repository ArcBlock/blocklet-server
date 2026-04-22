import { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import Spinner from '@mui/material/CircularProgress';
import Button from '@mui/material/IconButton';
import UpgradeIcon from '@mui/icons-material/ArrowUpward';
import Tooltip from '@mui/material/Tooltip';
import Toast from '@arcblock/ux/lib/Toast';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { BLOCKLET_MODES } from '@blocklet/constant';

import { getDisplayName, isInProgress } from '@blocklet/meta/lib/util';
import Tag from '../tag';
import Confirm from '../confirm';

import { useNodeContext } from '../contexts/node';
import { sleep, formatError, BlockletAdminRoles } from '../util';
import { withPermission } from '../permission';

function Version({ blocklet, checkUpgrade = false, hasPermission = false, ...rest }) {
  const { api } = useNodeContext();
  const { t } = useContext(LocaleContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newVersionBlocklet, setNewVersionBlocklet] = useState(null);
  const [confirmSetting, setConfirmSetting] = useState(null);

  useEffect(() => {
    setNewVersionBlocklet(null);
    if (checkUpgrade && blocklet.mode !== BLOCKLET_MODES.DEVELOPMENT) {
      // The implementation was removed and will be restore in the further
    }
  }, [blocklet, checkUpgrade]); // eslint-disable-line

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async () => {
    setLoading(true);

    try {
      const input = {
        did: blocklet.meta.did,
        version: newVersionBlocklet.version,
        storeUrl: newVersionBlocklet.registryUrl || '',
      };
      await sleep(2000);
      await api.upgradeBlocklet({ input });
    } catch (err) {
      Toast.error(`Blocklet upgrade failed: ${formatError(err)}`);
    } finally {
      setLoading(false);
      setConfirmSetting(null);
    }
  };

  const setting = {
    title: `${t('common.upgrade')} ${t('common.blocklet')} ${getDisplayName(blocklet)}`,
    description: t('blocklet.action.upgradeDescription'),
    confirm: t('blocklet.action.confirmUpgrade'),
    cancel: t('common.cancel'),
    onConfirm,
    onCancel,
  };

  if (hasPermission && newVersionBlocklet && !isInProgress(blocklet.status)) {
    return (
      <>
        <Tag {...rest}>{blocklet.meta.version}</Tag>
        <Tooltip title={t('common.updateAvailable', { version: newVersionBlocklet.version })}>
          <Button size="small" style={{ marginLeft: 8 }} disabled={loading} onClick={() => setConfirmSetting(setting)}>
            {loading ? <Spinner size={16} /> : <UpgradeIcon style={{ fontSize: 16, color: 'red' }} />}
          </Button>
        </Tooltip>
        {!!error && <Toast variant="error" message={error} onClose={() => setError('')} />}
        {confirmSetting && (
          <Confirm
            title={confirmSetting.title}
            description={confirmSetting.description}
            confirm={confirmSetting.confirm}
            cancel={confirmSetting.cancel}
            params={confirmSetting.params}
            onConfirm={confirmSetting.onConfirm}
            onCancel={confirmSetting.onCancel}
          />
        )}
      </>
    );
  }

  return <Tag {...rest}>{blocklet.meta.version}</Tag>;
}

Version.propTypes = {
  blocklet: PropTypes.object.isRequired,
  checkUpgrade: PropTypes.bool,
  hasPermission: PropTypes.bool,
};

const BlockletVersionInDaemon = withPermission(Version, 'mutate_blocklets');
const BlockletVersionInService = withPermission(Version, '', BlockletAdminRoles);

export default function BlockletVersion(props) {
  const { inService } = useNodeContext();

  if (inService) {
    return <BlockletVersionInService {...props} />;
  }

  return <BlockletVersionInDaemon {...props} />;
}
