import { it, expect, describe } from 'bun:test';
import { DockerArgs } from '../src/docker-parse-command';
import { dockerParsePublishPorts } from '../src/docker-parse-publish-ports';

describe('dockerPublishPorts', () => {
  it('should return the correct publish ports', () => {
    const dockerArgs = [
      { key: '--publish', value: '6088:8088' },
      { key: '--publish', value: '8043:8043' },
    ] as DockerArgs;
    const result = dockerParsePublishPorts('frigate', dockerArgs);
    expect(result.length).toBe(2);
    expect(result[0]).toStrictEqual({
      type: 'docker',
      name: 'frigate-1',
      path: '/frigate-1',
      port: '6088',
      containerPort: 8088,
      hostIP: '127.0.0.1',
      prefix: '/frigate-1',
      proxyBehavior: '',
    });
    expect(result[1]).toStrictEqual({
      type: 'docker',
      name: 'frigate-2',
      path: '/frigate-2',
      port: '8043',
      containerPort: 8043,
      hostIP: '127.0.0.1',
      prefix: '/frigate-2',
      proxyBehavior: '',
    });
  });

  it('should return no ports', () => {
    const dockerArgs = [] as DockerArgs;
    const result = dockerParsePublishPorts('frigate', dockerArgs);
    expect(result).toEqual([]);
  });

  it('should udp and tcp ports', () => {
    const dockerArgs = [
      { key: 'docker', value: 'run' },
      { key: '--name', value: 'frigate' },
      { key: '--publish', value: '8088:8088' },
      { key: '--publish', value: '8043:8043' },
      { key: '--publish', value: '8043:8043/udp' },
      { key: '--publish', value: '8043:8043/tcp' },
    ] as DockerArgs;
    const result = dockerParsePublishPorts('frigate', dockerArgs);
    expect(result.length).toBe(2);
    expect(result[0]).toStrictEqual({
      type: 'docker',
      name: 'frigate-1',
      path: '/frigate-1',
      port: '8088',
      containerPort: 8088,
      hostIP: '127.0.0.1',
      proxyBehavior: '',
      prefix: '/frigate-1',
    });
    expect(result[1]).toStrictEqual({
      type: 'docker',
      name: 'frigate-2',
      path: '/frigate-2',
      port: '8043',
      containerPort: 8043,
      hostIP: '127.0.0.1',
      proxyBehavior: '',
      prefix: '/frigate-2',
    });
  });

  it('should has hostIP', () => {
    const dockerArgs = [
      { key: '--publish', value: '127.0.0.1:8001:8088' },
      { key: '--publish', value: 'localhost:9002:8088' },
      { key: '--publish', value: 'localhost:9003:8088' },
      // { key: '--publish', value: '9090' },
    ] as DockerArgs;
    const result = dockerParsePublishPorts('frigate', dockerArgs);
    expect(result.length).toBe(3);

    expect(result[0]).toStrictEqual({
      type: 'docker',
      name: 'frigate-1',
      path: '/frigate-1',
      port: '8001',
      containerPort: 8088,
      hostIP: '127.0.0.1',
      proxyBehavior: '',
      prefix: '/frigate-1',
    });
    expect(result[1]).toStrictEqual({
      type: 'docker',
      name: 'frigate-2',
      path: '/frigate-2',
      port: '9002',
      containerPort: 8088,
      hostIP: 'localhost',
      proxyBehavior: '',
      prefix: '/frigate-2',
    });
    expect(result[2]).toStrictEqual({
      type: 'docker',
      name: 'frigate-3',
      path: '/frigate-3',
      port: '9003',
      containerPort: 8088,
      hostIP: 'localhost',
      proxyBehavior: '',
      prefix: '/frigate-3',
    });
  });
});
