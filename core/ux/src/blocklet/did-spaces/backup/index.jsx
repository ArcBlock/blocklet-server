import React from 'react';
import isEmpty from 'lodash/isEmpty';
import Center from '@arcblock/ux/lib/Center';
import { CircularProgress } from '@mui/material';
import Disconnect from './disconnect';
import Connected from './connected';
import { BlockletStorageProvider, useBlockletStorageContext } from '../../../contexts/blocklet-storage';

function Backup() {
  const { spaceGatewaysFirstLoading, spaceGateways } = useBlockletStorageContext();

  if (spaceGatewaysFirstLoading) {
    return (
      <Center relative="parent">
        <CircularProgress />
      </Center>
    );
  }

  if (isEmpty(spaceGateways)) {
    return <Disconnect />;
  }

  return <Connected />;
}

export default function BlockletBackup() {
  return (
    <BlockletStorageProvider>
      <Backup />
    </BlockletStorageProvider>
  );
}
