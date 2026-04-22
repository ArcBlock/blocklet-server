/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: 'Restaurar Blocklet',
      description: 'Por favor, selecione o bloco que você deseja restaurar',
      verify: {
        title: 'Verificar Propriedade',
        subTitle: 'Verifique a posse do blocklet com sua Carteira DID',
        verify: 'Verificar',
        reconnect: 'Experimente outro bloco',
        scan: 'Use os seguintes métodos para provar a propriedade',
        confirm: 'Delegar a assinatura para permitir que o servidor faça o download e descriptografe o backup',
        success: 'Propriedade verificada, a restauração está em andamento',
        exists: 'Este bloco já existe neste servidor e a restauração foi cancelada',
        open: 'Visite o Bloco',
        overwrite: 'Sobrescrever',
      },
      overwrite: {
        title: 'Deseja substituir o bloco existente?',
        description:
          'O blocklet que você está restaurando já existe neste servidor, você deseja sobrescrevê-lo? O blocklet existente será excluído primeiro se você continuar',
      },
      restore: {
        title: 'Restaurar Blocklet',
      },
    },
    restoreFromServer: {
      selectTitle: 'Selecione Aplicativo',
      description: 'Por favor, selecione a aplicação que você deseja restaurar',
      backupIn: 'Backup em',
    },
    restoreFromSpaces: {
      title: 'Restaurar do DID Spaces',
      navSubTitle: 'Restaurar',
      connect: {
        title: 'Conectar-se a DID Spaces',
        subTitle: 'Acesse o DID Spaces e selecione o blocklet que você deseja restaurar.',
        select: 'Selecione o gateway de espaços de DID',
        connect: 'Conectar',
      },
      selectBlocklet: {
        title: 'Selecionar App',
      },
      restore: {
        title: 'Restaurar App',
        subTitle: 'O aplicativo está sendo restaurado',
        completeTitle: 'Tudo está pronto',
        installedTitle: 'Sucesso restaurado!',
        installedSubTitle: 'Mas ainda precisa de algumas configurações para começar',
        support:
          "Se a tentativa de novo não funcionar, por favor peça ajuda na <a href='{communityLink}' target='_blank'>comunidade</a> ou entre em contato conosco em <a href='mailto: {supportEmail}'>{supportEmail}</a>.",
      },
      nftAuthDialog: {
        title: 'Por favor, apresente o seu App Space NFT',
        scan: 'Escaneie o código QR com sua Carteira DID para apresentar seu NFT',
        confirm: 'Confirmar na sua conta',
        success: 'NFT verificado com sucesso!',
      },
      progress: {
        waiting: 'Aguardando restauração...',
        restoring: 'Restaurando...',
        importData: 'Importando dados...',
        downloading: 'Baixando arquivos, progresso: {progress}',
        importSuccess: 'Importação concluída com sucesso!',
        installing: 'Instalando...',
      },
    },
  },
  server: {
    checkUpgrade: 'Verificar nova versão',
  },
};
