/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: 'Abrufen der Blocklet-Liste aus dem Register "{registryUrl}" ist fehlgeschlagen.',
  },
  backup: {
    space: {
      error: {
        title: 'Fehler beim Sichern in DID Spaces',
        forbidden:
          'Sie haben keine Berechtigung, das Backup durchzuführen. Versuchen Sie, die Anwendungslizenz in DID Spaces wiederherzustellen oder verbinden Sie sich erneut mit DID Spaces und versuchen Sie es erneut',
      },
      isFull:
        'Der aktuelle DID Space Speicherplatz ist voll, bitte erweitern Sie den Speicherplatz und sichern Sie erneut',
      lackOfSpace:
        'Der derzeit verfügbare Speicherplatz ist unzureichend. Bitte erweitern Sie den Speicherplatz und führen Sie das Backup erneut durch.',
      unableEnableAutoBackup:
        'Automatisches Backup nicht aktivierbar. Stelle zuerst eine Verbindung mit DID Spaces her.',
    },
  },
};
