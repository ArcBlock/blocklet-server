# Blocklet logger

A library to facilitate Blocklet logging.

## Usage

```javascript
const logger = require('@blocklet/logger');

// log
log = logger('demo');
log.info('this is demo', { id: 'test-id' });
log.warn('this is demo', { id: 'test-id' });
log.error('this is demo', { id: 'test-id' });
log.debug('this is demo', { id: 'test-id' });

// access log
app.use(morgan('combined', { stream: logger.getAccessLogStream() }));
```
