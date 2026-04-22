import React, { useMemo } from 'react';
import { Box, Stack } from '@mui/material';
import Alert from '@mui/material/Alert';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { isAccessible } from '@blocklet/meta/lib/util';

import DomainListWithPermission from './component/domain-list';
import DomainActionCard from './component/domain-action-card';
import { isServerless } from './util';

import { useBlockletContext } from '../contexts/blocklet';
import { useNodeContext } from '../contexts/node';

export default function BlockletDomains() {
  const {
    blocklet,
    actions: { updateBlockletDomainAliases },
  } = useBlockletContext();
  const { inService } = useNodeContext();
  const { t } = useLocaleContext();

  const hasMutatePermission = useMemo(() => {
    let res = true;
    if (isServerless(blocklet)) {
      res = res && inService;
    }

    return res;
  }, [inService, blocklet]);

  return (
    <Box
      component={Stack}
      sx={{
        gap: 3,
        maxWidth: 820,
      }}>
      <>
        {isAccessible(blocklet.status) === false && <Alert severity="warning">{t('blocklet.router.noRunning')}</Alert>}

        {hasMutatePermission && (
          <DomainActionCard
            blocklet={blocklet}
            updateBlockletDomainAliases={updateBlockletDomainAliases}
            connectDomainProps={{ shouldCheckDomain: true }}
          />
        )}
      </>
      <DomainListWithPermission showAllDomains updateBlockletDomainAliases={updateBlockletDomainAliases} />
    </Box>
  );
}
