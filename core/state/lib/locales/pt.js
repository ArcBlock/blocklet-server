/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: 'Falha ao obter a lista de Blocklets do registro "{registryUrl}".',
  },
  backup: {
    space: {
      error: {
        title: 'Backup para DID Spaces encontrou um erro',
        forbidden:
          'Você não tem permissão para realizar o backup, tente restaurar a licença do aplicativo em DID Spaces ou reconecte-se a DID Spaces e tente novamente',
      },
      isFull:
        'O espaço de armazenamento do DID Space atual está cheio, por favor expanda o espaço e faça o backup novamente',
      lackOfSpace:
        'O espaço disponível atualmente no armazenamento é insuficiente. Por favor, expanda o espaço e execute o backup novamente.',
      unableEnableAutoBackup: 'Não é possível habilitar o backup automático, conecte-se a Espaços DID primeiro',
    },
  },
};
