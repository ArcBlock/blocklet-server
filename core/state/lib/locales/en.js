/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: 'Failed to get blocklet list from registry "{registryUrl}"',
  },
  backup: {
    space: {
      error: {
        title: 'Backup to DID Spaces Failed',
        forbidden: "You don't have permission to back up. Try restoring the license on DID Spaces or reconnect.",
      },
      isFull: 'Your DID Spaces storage is full. Expand storage and try again.',
      lackOfSpace: 'Not enough storage space. Expand storage and try again.',
      unableEnableAutoBackup: 'Connect to DID Spaces before enabling auto backup.',
    },
  },
};
