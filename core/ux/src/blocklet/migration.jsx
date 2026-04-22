import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@arcblock/ux/lib/Button';
import { APP_STRUCT_VERSION, DEFAULT_DID_DOMAIN, DEFAULT_IP_DOMAIN_SUFFIX } from '@abtnode/constant';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { getDisplayName, forEachBlockletSync, isBlockletRunning } from '@blocklet/meta/lib/util';

import Toast from '@arcblock/ux/lib/Toast';
import { useNodeContext } from '../contexts/node';
import { useBlockletContext } from '../contexts/blocklet';
import { useSessionContext } from '../contexts/session';
import { formatError } from '../util';
import { getWalletType } from './util';

const findDuplicate = (blocklet) => {
  const map = {};
  let duplicate = null;

  forEachBlockletSync(blocklet, (component) => {
    if (map[component.meta.bundleDid]) {
      duplicate = getDisplayName(component, true);
    } else if (component.meta.bundleDid) {
      map[component.meta.bundleDid] = true;
    }
  });

  return duplicate;
};

const getNewHref = (location, blocklet, inService) => {
  const { hostname, href } = location;
  if (!blocklet) {
    return href;
  }

  if (inService) {
    const ipRegex = /\d+[-.]\d+[-.]\d+[-.]\d+/;
    const match = ipRegex.exec(hostname);
    if (!match) {
      return href;
    }
    const ip = match[0];

    const didDomain =
      (blocklet.site?.domainAliases || [])
        .map((x) => x.value)
        .filter(Boolean)
        .find((x) => x.endsWith(DEFAULT_DID_DOMAIN)) || '';
    const base32Did = didDomain.replace(`.${DEFAULT_DID_DOMAIN}`, '');
    if (!base32Did) {
      return href;
    }

    return href.replace(hostname, `${base32Did}-${ip}.${DEFAULT_IP_DOMAIN_SUFFIX}`);
  }

  return href.replace(blocklet.meta.bundleDid, blocklet.appPid);
};

export default function BlockletMigration() {
  const { t } = useLocaleContext();
  const { api } = useSessionContext();
  const { blocklet } = useBlockletContext();
  const { inService } = useNodeContext();
  const [openConnect, setOpenConnect] = useState(false);
  const [leftSec, setLeftSec] = useState(5);

  const needMigration = blocklet && blocklet.structVersion !== APP_STRUCT_VERSION;

  const onMigrate = () => {
    try {
      if (isBlockletRunning(blocklet)) {
        Toast.error(t('blocklet.migrate.tip.running'));
        return;
      }

      const duplicate = findDuplicate(blocklet);
      if (duplicate) {
        Toast.error(t('blocklet.migrate.tip.duplicate', { name: duplicate }));
        return;
      }

      setOpenConnect(true);
    } catch (error) {
      Toast.error(formatError(error));
    }
  };

  const onSuccess = () => {
    const newHref = getNewHref(window.location, blocklet, inService);
    setTimeout(() => {
      // 本地域名，无需处理
      window.location.href = newHref;
    }, 5000);

    setLeftSec(5);
    setInterval(() => {
      setLeftSec((sec) => sec - 1);
    }, 1000);
  };

  const onClose = () => setOpenConnect(false);

  return [
    needMigration && (
      <Alert key="alert" severity="warning" style={{ margin: '12px 0' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}>
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={() => onMigrate()}
            style={{ marginRight: 8 }}>
            {t('blocklet.migrate.intro.l1')}
          </Button>
          <span>{t('blocklet.migrate.intro.l2')}</span>
        </Box>
        {['l3', 'l4', 'l5', 'l6'].map((x) => (
          <Box
            key={x}
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}>
            {t(`blocklet.migrate.intro.${x}`)}
          </Box>
        ))}
      </Alert>
    ),

    blocklet && (
      <DidConnect
        popup
        key="connect"
        open={openConnect}
        saveConnect={false}
        forceConnected={false}
        action="migrate-app-to-struct-v2"
        checkFn={api.get}
        checkTimeout={5 * 60 * 1000}
        onSuccess={onSuccess}
        extraParams={{
          appDid: blocklet.appDid,
          did: blocklet.meta.did,
          wt: getWalletType(blocklet, true),
          title: getDisplayName(blocklet),
        }}
        messages={{
          title: t('blocklet.migrate.title'),
          scan: t('blocklet.migrate.scan'),
          confirm: t('blocklet.migrate.confirm'),
          success: leftSec >= 0 ? t('blocklet.migrate.success', { sec: leftSec }) : 'Redirecting...',
        }}
        onClose={onClose}
      />
    ),
  ];
}
