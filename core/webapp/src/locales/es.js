/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: 'Restaurar Blocklet',
      description: 'Por favor, selecciona el bloque que deseas restaurar',
      verify: {
        title: 'Verificar Propiedad',
        subTitle: 'Verifica la propiedad del blocklet con tu billetera de DID',
        verify: 'Verificar',
        reconnect: 'Prueba otro bloque',
        scan: 'Use los siguientes métodos para probar la propiedad',
        confirm: 'Delegar la firma para permitir que el servidor descargue y desencripte la copia de seguridad',
        success: 'Propiedad verificada, la restauración está en progreso',
        exists: 'Este bloque ya existe en este servidor y la restauración está abortada',
        open: 'Visita Blocklet',
        overwrite: 'Sobreescribir',
      },
      overwrite: {
        title: '¿Sobrescribir bloque existente?',
        description:
          'El blocklet que está restaurando ya existe en este servidor, ¿desea sobre escribirlo? El blocklet existente se eliminará primero si continúa.',
      },
      restore: {
        title: 'Restaurar Bloque',
      },
    },
    restoreFromServer: {
      selectTitle: 'Seleccionar Aplicación',
      description: 'Por favor seleccione la aplicación que desea restaurar',
      backupIn: 'Respaldo en',
    },
    restoreFromSpaces: {
      title: 'Restaurar desde DID Spaces',
      navSubTitle: 'Restaurar',
      connect: {
        title: 'Conectar a DID Spaces',
        subTitle: 'Salta a DID Spaces y selecciona el blocklet que deseas restaurar.',
        select: 'Selecciona el Gateway de Espacios DID',
        connect: 'Conectar',
      },
      selectBlocklet: {
        title: 'Seleccionar aplicación',
      },
      restore: {
        title: 'Restaurar aplicación',
        subTitle: 'La aplicación se está restaurando',
        completeTitle: 'Todo está listo',
        installedTitle: '¡Restaurado exitosamente!',
        installedSubTitle: 'Pero aún necesita algunas configuraciones para comenzar',
        support:
          'Si reintentar no funciona, por favor solicita ayuda en la <a href="{communityLink}" target="_blank">comunidad</a> o contáctanos en <a href="mailto: {supportEmail}">{supportEmail}</a>.',
      },
      nftAuthDialog: {
        title: 'Por favor presenta tu App Space NFT',
        scan: 'Escanee el código QR con su billetera DID para presentar su NFT',
        confirm: 'Confirma en tu cuenta',
        success: '¡NFT verificado correctamente!',
      },
      progress: {
        waiting: 'Esperando restauración...',
        restoring: 'Restaurando...',
        importData: 'Importando datos...',
        downloading: 'Descargando archivos, progreso: {progress}',
        importSuccess: '¡Importación exitosa!',
        installing: 'Instalando...',
      },
    },
  },
  server: {
    checkUpgrade: 'Revisar nueva versión',
  },
};
