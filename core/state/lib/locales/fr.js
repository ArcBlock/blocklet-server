/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: 'Échec de l\'obtention de la liste Blocklet à partir du registre "{registryUrl}".',
  },
  backup: {
    space: {
      error: {
        title: 'Erreur lors de la sauvegarde dans DID Spaces',
        forbidden:
          "Vous n'êtes pas autorisé à effectuer la sauvegarde, essayez de restaurer la licence de l'application sur DID Spaces ou reconnectez-vous à DID Spaces et réessayez",
      },
      isFull: "L'espace de stockage actuel de DID Space est plein, veuillez étendre l'espace et sauvegarder à nouveau",
      lackOfSpace:
        "L'espace disponible actuel dans le stockage est insuffisant. Veuillez étendre l'espace et effectuer à nouveau la sauvegarde.",
      unableEnableAutoBackup:
        "Impossible d'activer la sauvegarde automatique. Veuillez d'abord vous connecter à DID Spaces.",
    },
  },
};
