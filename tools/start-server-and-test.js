/* eslint-disable no-console */
const { spawn } = require('child_process');
const waitPort = require('wait-port');

const timeout = 60 * 1000;

function startServerAndTest(startCommand, testCommand) {
  console.log('starting server...');
  function forward(tag, stream, error = false) {
    stream.on('data', (buf) => {
      const line = `[${tag}] ${buf}`;
      process.stdout.write(line);
      if (error) {
        console.error(line);
      } else {
        console.log(line);
      }
    });
  }

  const server = spawn('npm', ['run', startCommand], { stdio: ['ignore', 'pipe', 'pipe'] });
  // 只打印错误, 不然 e2e 的日志太多了
  // forward('server', server.stdout, false);
  forward('server:err', server.stderr, true);

  const startTest = () => {
    console.log('starting test...');
    const test = spawn('npm', ['run', testCommand], { stdio: 'inherit' });

    test.on('error', (error) => {
      console.error('Error running test command:', error);
      server.kill(); // Kill the server when an error occurs
      process.exit(1);
    });

    test.on('exit', (code) => {
      server.kill(); // Kill the server when tests are done
      process.exit(code);
    });
  };

  console.log('waiting client server...');
  Promise.all([
    // 需要同时等待两个端口
    waitPort({ host: '127.0.0.1', port: 3030, timeout, interval: 1000 }),
    waitPort({ host: '127.0.0.1', port: 3000, timeout, interval: 1000 }),
  ])
    .then(([apiResult, clientResult]) => {
      if (apiResult.open && clientResult.open) {
        startTest();
      }
    })
    .catch(() => {
      console.error(`Server failed to start, timed out after ${timeout}`);
      server.kill(); // Kill the server if it takes too long to start
      process.exit(1);
    });
}

// Get the start and test commands from the command line arguments
const [startCommand, testCommand] = process.argv.slice(2);
startServerAndTest(startCommand, testCommand);
