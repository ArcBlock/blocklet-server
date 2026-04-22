/* eslint-disable react/prop-types */
import React, { useState } from 'react'; // eslint-disable-line no-unused-vars

import ClearCache from '@abtnode/ux/lib/clear-cache';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { DangerZone, DangerItem } from '../../danger-zone';
import { useNodeContext } from '../../../contexts/node';

export default function MaintainCache() {
  const { t } = useLocaleContext();
  const { info } = useNodeContext();

  return (
    <DangerZone className="danger-zone">
      <DangerItem title={t('blocklet.config.clearCache.name')} description={t('blocklet.config.clearCache.purpose')}>
        <ClearCache teamDid={info.did} size="large" />
      </DangerItem>
    </DangerZone>
  );
}
