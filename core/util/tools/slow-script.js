// use a synchronous busy-wait to ensure the script does not exit immediately
const timeout = 2000;
const start = Date.now();
while (Date.now() - start < timeout) {
  // busy wait
}
