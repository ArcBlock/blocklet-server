# @abtnode/queue

A simple job queue built on top of [nedb](https://www.npmjs.com/package/nedb) and [fastq](https://www.npmjs.com/package/fastq)

## Usage

```shell
yarn add @abtnode/queue
```

Then:

```javascript
const createQueue = require('@abtnode/queue');

const queue = createQueue({
  file: '/path/to/job.db',
  onJob: (job) => {
    console.log('onJob', job);
    const result = someLongTask(job);

    return result;
  },
});

const task = queue.push({ id: 2 });
task.on('failed', ({ id, job, error }) => {
  console.error('job failed', error);
});
task.on('finished', ({ id, job, result }) => {
  console.log('job finished', result);
});
```
