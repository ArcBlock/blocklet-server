import { useEffect, useState } from 'react';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { SERVER_STATUS } from '@abtnode/constant';
import Confirm from '@abtnode/ux/lib/confirm';

import { useNodeContext } from '../contexts/node';

export default function CheckNodeStatus() {
  const { t } = useLocaleContext();
  const { info: nodeInfo = {}, api } = useNodeContext();
  const [open, setOpen] = useState();

  const { status } = nodeInfo;

  useEffect(() => {
    if (status === SERVER_STATUS.START_FROM_CRASH) {
      setOpen(true);
      api.resetNodeStatus().catch(err => {
        console.error(err.message);
      });
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const onConfirm = () => {
    setOpen(false);
  };

  if (!open) {
    return null;
  }

  return (
    <Confirm
      description={t('dashboard.startFromCrashTip')}
      confirm={t('common.confirm')}
      showCancel={false}
      color="primary"
      onConfirm={onConfirm}
    />
  );
}
