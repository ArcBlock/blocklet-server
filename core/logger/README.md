# `logger`

This is a log library for ABT Node.

## Enable logging first

Set the environments: `process.env.ABT_NODE_LOG_DIR = {logging directory}`.

## Write to files

Set the environments: `process.env.NODE_ENV = 'production'`.

## Writing to console

`DEBUG=@abtnode/* npm run xxx`.

**Or, the logs will be write to stdout.**

## Rotate log files

Rotate log files every day, log filename formate `{label}-YYYY-MM-DD.log`.

## [!Important] Default retained log files

Because it is for internal use, the default log is kept for **60 days**.

## Usage

```javascript
const logger = require('@abtnode/logger')('@blocklet/cli');

// log info
logger.info('detail blocklet', { did: 'z8iZpWP3gto8RWk9UHfvAaYtqX5wZ3Mz9BrHA' });
// [2020-08-12 17:26:28] [info]  "detail blocklet" {"did":"z8iZpWP3gto8RWk9UHfvAaYtqX5wZ3Mz9BrHA"}

// log error: must pass an object
logger.info('this is an error', { error: new Error('test') });
```
