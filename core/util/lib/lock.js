const { EventEmitter } = require('events');

const locks = new Map();

class Lock {
  constructor(name) {
    this.name = name;
    this.locked = false;
    this.events = new EventEmitter();
  }

  acquire() {
    return new Promise((resolve) => {
      // If somebody has the lock, wait until he/she releases the lock and try again
      if (this.locked) {
        const tryAcquire = () => {
          if (!this.locked) {
            this.locked = true;
            this.events.removeListener('release', tryAcquire);
            resolve(true);
          }
        };

        this.events.on('release', tryAcquire);
      } else {
        // Otherwise, take the lock and resolve immediately
        this.locked = true;
        resolve(true);
      }
    });
  }

  release() {
    // Release the lock immediately
    this.locked = false;
    setImmediate(() => this.events.emit('release'));
  }

  static getLock(name) {
    if (!locks.has(name)) {
      locks.set(name, new Lock(name));
    }

    return locks.get(name);
  }
}

module.exports = Lock;
