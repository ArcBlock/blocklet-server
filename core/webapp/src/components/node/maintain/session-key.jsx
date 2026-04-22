/* eslint-disable react/prop-types */
import React, { useState } from 'react'; // eslint-disable-line no-unused-vars

import RotateSessionKey from '@abtnode/ux/lib/rotate-session-key';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { DangerZone, DangerItem } from '../../danger-zone';
import { useNodeContext } from '../../../contexts/node';

export default function MaintainSessionKey() {
  const { t } = useLocaleContext();
  const { info } = useNodeContext();

  return (
    <DangerZone className="danger-zone">
      <DangerItem
        title={t('blocklet.config.rotateSessionKey.name')}
        description={t('blocklet.config.rotateSessionKey.purpose')}>
        <RotateSessionKey teamDid={info.did} size="large" />
      </DangerItem>
    </DangerZone>
  );
}
