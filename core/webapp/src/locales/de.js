/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: 'Blocklet wiederherstellen',
      description: 'Bitte wählen Sie das Blocklet aus, das Sie wiederherstellen möchten',
      verify: {
        title: 'Überprüfen Sie das Eigentum',
        subTitle: 'Überprüfen Sie den Eigentumsnachweis des Blocklets mit Ihrer DID Wallet',
        verify: 'Überprüfen',
        reconnect: 'Versuchen Sie einen anderen Blocklet',
        scan: 'Verwenden Sie die folgenden Methoden zum Besitznachweis',
        confirm: 'Signiere die Delegation, damit der Server das Backup herunterladen und entschlüsseln kann',
        success: 'Eigentumsüberprüfung abgeschlossen, die Wiederherstellung läuft',
        exists: 'Dieses Blocklet existiert bereits auf diesem Server und die Wiederherstellung wurde abgebrochen',
        open: 'Besuche Blocklet',
        overwrite: 'Überschreiben',
      },
      overwrite: {
        title: 'Existierende Blocklet überschreiben?',
        description:
          'Die Blocklet, die Sie wiederherstellen, existiert bereits auf diesem Server. Möchten Sie sie überschreiben?',
      },
      restore: {
        title: 'Wiederherstellen Blocklet',
      },
    },
    restoreFromServer: {
      selectTitle: 'Wählen Sie Anwendung',
      description: 'Bitte wählen Sie die Anwendung aus, die Sie wiederherstellen möchten',
      backupIn: 'Backup in',
    },
    restoreFromSpaces: {
      title: 'Wiederherstellen von DID Spaces',
      navSubTitle: 'Wiederherstellen',
      connect: {
        title: 'Verbinden mit DID Spaces',
        subTitle: 'Springe zu DID Spaces und wähle den Blocklet aus, den du wiederherstellen möchtest.',
        select: 'Wählen Sie DID Spaces Gateway aus',
        connect: 'Verbinden',
      },
      selectBlocklet: {
        title: 'Wähle App',
      },
      restore: {
        title: 'App wiederherstellen',
        subTitle: 'Die App wird wiederhergestellt',
        completeTitle: 'Alles ist bereit',
        installedTitle: 'Erfolgreich wiederhergestellt!',
        installedSubTitle: 'Aber es sind immer noch einige Konfigurationen erforderlich, um zu starten',
        support:
          'Wenn das erneute Versuchen nicht funktioniert, bitten Sie um Hilfe in der <a href="{communityLink}" target="_blank">Community</a> oder kontaktieren Sie uns unter <a href="mailto: {supportEmail}">{supportEmail}</a>.',
      },
      nftAuthDialog: {
        title: 'Bitte präsentiere deinen App Space NFT',
        scan: 'Scannen Sie den QR-Code mit Ihrer DID Wallet, um Ihr NFT vorzustellen',
        confirm: 'Bestätigen Sie in Ihrem Konto',
        success: 'NFT erfolgreich verifiziert!',
      },
      progress: {
        waiting: 'Warten auf Wiederherstellung...',
        restoring: 'Wiederherstellen...',
        importData: 'Daten importieren...',
        downloading: 'Dateien werden heruntergeladen, Fortschritt: {progress}',
        importSuccess: 'Erfolgreich importiert!',
        installing: 'Installiere...',
      },
    },
  },
  server: {
    checkUpgrade: 'Überprüfe neue Version',
  },
};
