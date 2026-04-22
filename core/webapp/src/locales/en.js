/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: 'Restore Blocklet',
      description: 'Please select the blocklet you want to restore',
      verify: {
        title: 'Verify Ownership',
        subTitle: 'Verify ownership of the blocklet with your wallet',
        verify: 'Verify',
        reconnect: 'Try another blocklet',
        scan: 'Scan the QR code to prove ownership',
        confirm: 'Sign to allow the server to download and decrypt the backup',
        success: 'Ownership verified. Restoring now.',
        exists: 'This blocklet already exists on this server',
        open: 'Visit Blocklet',
        overwrite: 'Overwrite',
      },
      overwrite: {
        title: 'Overwrite existing blocklet?',
        description:
          'The blocklet you are restoring already exists on this server. Do you want to overwrite it? The existing blocklet will be deleted first if you continue.',
      },
      restore: {
        title: 'Restore Blocklet',
      },
    },
    restoreFromServer: {
      selectTitle: 'Select Application',
      description: 'Please select the application you want to restore',
      backupIn: 'Backup in',
    },
    restoreFromSpaces: {
      title: 'Restore from DID Spaces',
      navSubTitle: 'Restore',
      connect: {
        title: 'Connect to DID Spaces',
        subTitle: 'Jump to DID Spaces, and select the blocklet you want to restore.',
        select: 'Select DID Spaces Gateway',
        connect: 'Connect',
      },
      selectBlocklet: {
        title: 'Select App',
      },
      restore: {
        title: 'Restore App',
        subTitle: 'The app is being restored',
        completeTitle: 'Everything is Ready',
        installedTitle: 'Successfully restored!',
        installedSubTitle: 'But still needs some configuration to start',
        support:
          'If retrying does not work, please ask help in the <a href="{communityLink}" target="_blank">community</a> or contact us at <a href="mailto: {supportEmail}">{supportEmail}</a>.',
      },
      nftAuthDialog: {
        title: 'Present Your App Space NFT',
        scan: 'Scan the QR code with your wallet to present your NFT',
        confirm: 'Confirm in your wallet',
        success: 'NFT verified',
      },
      progress: {
        waiting: 'Waiting for restore...',
        restoring: 'Restoring...',
        importData: 'Importing data...',
        downloading: 'Downloading files, progress: {progress}',
        importSuccess: 'Successfully imported!',
        installing: 'Installing...',
      },
    },
  },
  server: {
    checkUpgrade: 'Check new version',
  },
};
