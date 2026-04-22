const { Socket } = require('axon');

function ensureListening(...ports) {
  const promises = ports.map(
    (port) =>
      new Promise((resolve, reject) => {
        const socket = new Socket();
        socket.connect(Number(port));

        socket.on('connect', () => {
          resolve(socket);
        });

        socket.on('error', (err) => {
          reject(err);
        });
      })
  );

  return Promise.all(promises);
}

module.exports = ensureListening;
