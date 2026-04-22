/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: 'Restaurer le bloclet',
      description: 'Veuillez sélectionner le bloc que vous souhaitez restaurer',
      verify: {
        title: 'Vérifier la propriété',
        subTitle: 'Vérifiez la propriété du blocklet avec votre portefeuille DID',
        verify: 'Vérifier',
        reconnect: 'Essayez un autre bloclet',
        scan: 'Utilisez les méthodes suivantes pour prouver la propriété',
        confirm: 'Déléguer la signature pour permettre au serveur de télécharger et décrypter la sauvegarde',
        success: 'Propriété vérifiée, la restauration est en cours',
        exists: 'Ce bloclet existe déjà sur ce serveur et la restauration est abandonnée',
        open: 'Visitez Blocklet',
        overwrite: 'Écraser',
      },
      overwrite: {
        title: 'Écraser le blocklet existant?',
        description: "Le blocklet que vous restaurez existe déjà sur ce serveur, voulez-vous l'écraser ?",
      },
      restore: {
        title: 'Restaurer le Blocklet',
      },
    },
    restoreFromServer: {
      selectTitle: "Sélectionnez l'application",
      description: "Veuillez sélectionner l'application que vous souhaitez restaurer",
      backupIn: 'Sauvegarde en',
    },
    restoreFromSpaces: {
      title: 'Restaurer à partir des espaces DID',
      navSubTitle: 'Restaurer',
      connect: {
        title: 'Connecter à DID Spaces',
        subTitle: 'Accédez à DID Spaces et sélectionnez le blocklet que vous souhaitez restaurer.',
        select: 'Sélectionnez la passerelle DID Spaces',
        connect: 'Connecter',
      },
      selectBlocklet: {
        title: 'Sélectionner une application',
      },
      restore: {
        title: "Restaurer l'application",
        subTitle: "L'application est en cours de restauration",
        completeTitle: 'Tout est prêt',
        installedTitle: 'Restauré avec succès!',
        installedSubTitle: 'Mais il faut encore quelques configurations pour démarrer',
        support:
          'Si la nouvelle tentative ne fonctionne pas, veuillez demander de l\'aide dans la <a href="{communityLink}" target="_blank">communauté</a> ou nous contacter à <a href="mailto: {supportEmail}">{supportEmail}</a>.',
      },
      nftAuthDialog: {
        title: 'Veuillez présenter votre App Space NFT',
        scan: 'Scannez le code QR avec votre portefeuille DID pour présenter votre NFT',
        confirm: 'Confirmer dans votre compte',
        success: 'NFT vérifié avec succès !',
      },
      progress: {
        waiting: 'En attente de restauration...',
        restoring: 'Restauration...',
        importData: 'Importation des données...',
        downloading: 'Téléchargement des fichiers, progression : {progress}',
        importSuccess: 'Importation réussie!',
        installing: 'Installation en cours...',
      },
    },
  },
  server: {
    checkUpgrade: 'Vérifier nouvelle version',
  },
};
