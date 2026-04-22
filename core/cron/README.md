# Cron Scheduler

A simple wrapper around `cron` to manage jobs in ABT Node

## Usage

```shell
yarn add @abtnode/core
```

Then:

```javascript
const Cron = require('@abtnode/cron');

const fetchIp = () => console.log('fetching ip...');

// Initialize cron scheduler
Cron.init({
  context: {},
  jobs: [
    {
      name: 'refetch-ip',
      time: '0 */30 * * * *', // refetch every 30 minutes
      fn: fetchIp,
    },
  ],
  onError: (error, name) => {
    console.log(`Run job ${name} failed with error: ${error.message}`);
  },
});
```
