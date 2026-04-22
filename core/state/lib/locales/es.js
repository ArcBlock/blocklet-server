/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: 'Falló obtener la lista de Blocklets del registro "{registryUrl}".',
  },
  backup: {
    space: {
      error: {
        title: 'Error al realizar la copia de seguridad en DID Spaces',
        forbidden:
          'No tienes permiso para realizar la copia de seguridad, intenta restaurar la licencia de la aplicación en DID Spaces o vuelve a conectar a DID Spaces e intenta nuevamente',
      },
      isFull:
        'El espacio de almacenamiento actual de DID Space está lleno, por favor expanda el espacio y realice una copia de seguridad de nuevo',
      lackOfSpace:
        'El espacio disponible actual en el almacenamiento es insuficiente. Por favor, amplíe el espacio y realice la copia de seguridad nuevamente.',
      unableEnableAutoBackup:
        'no se puede habilitar la copia de seguridad automática, conéctese primero a los espacios DID',
    },
  },
};
