# Migration Scripts

> This folder contains migration scripts that makes auto upgrading possible of ABT Node

Migration scripts is a minimal migration framework for ABT Node.

Migration scripts provide an easy way to seed your state db, transition data when your models change, or run transformation scripts against your state db.

Migration scripts should be named using a semantic version followed by an optional key, like 0.0.1-init.js. The version numbers are used to order the scripts correctly, while the keys are a nice way to identify what each script does.

Each script file should export a single function, which should accept the following argument object:

- `node`: the ABT Node object, which exposes many api to manipulate the state
- `states`: contains ref to all the state db instances, such as `NodeState`, `BlockletState`
- `config`: ABT Node config object
- `configFile`: ABT Node config file path
- `dataDir`: ABT Node data directory
- `printInfo`: If you want to print a message within the task
- `printError`: If you want to print an error within the task
- `printSuccess`: If you want to print a success message within the task

All the script files will be executed (each one waits for the previous script to complete) before ABT Node is started.

If the previous script throws an error it will be reported to the console, and ABT Node starting will halt.

Migration scripts are only run once, and each completed script is logged in an `migration` state db.

You can add a `__test__` attribute to a script to skip the marking step, so it will run every time.

## Example

The following script update config file

```javascript
const fs = require('fs');
const yaml = require('js-yaml');
const get = require('lodash/get');
const set = require('lodash/set');

module.exports = async ({ states, config, configFile, printInfo }) => {
  printInfo('Try to update node config to 1.0.21...');
  let changed = false;

  const rawConfig = yaml.load(fs.readFileSync(configFile).toString());
  const info = await states.node.read();

  const updates = [
    { key: 'routing.httpPort', value: 80 },
    { key: 'routing.httpsPort', value: 443 },
    { key: 'mode', value: 'production' },
  ];
  updates.forEach(({ key, value }) => {
    if (!get(info, key)) {
      printInfo(`> Add new config: ${key}`);
      set(rawConfig, `node.${key}`, value);
      set(config, `node.${key}`, value);
      set(info, key, value);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(configFile, yaml.dump(rawConfig));
    printInfo(`> Persist new config to file: ${configFile}`);
    await states.node.updateNodeInfo(info);
    printInfo('> Persist new config to state db');
  }
};

module.exports.__test__ = true;
```
