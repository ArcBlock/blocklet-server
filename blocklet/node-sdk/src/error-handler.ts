process
  .on('uncaughtException', (err) => {
    console.error(err.message);
    process.exit(1);
  })
  .on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection promise:', promise, 'reason:', (reason as Error)?.message || reason);
    process.exit(1);
  });
