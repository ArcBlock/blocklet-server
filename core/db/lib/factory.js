module.exports = (initializer) => {
  const states = {};

  return new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === 'init') {
          return (...args) => Object.assign(states, initializer(...args));
        }

        if (states[prop]) {
          return states[prop];
        }

        throw new Error(`State ${String(prop)} may not be initialized in core`);
      },
    }
  );
};
