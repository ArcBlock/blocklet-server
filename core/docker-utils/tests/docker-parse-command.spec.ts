/* eslint-disable @typescript-eslint/comma-dangle */
/* eslint-disable no-useless-concat */
import { it, expect, describe } from 'bun:test';
import {
  isVolumePath,
  dockerParseCommand,
  dockerBuildCommand,
  DockerArgs,
  DockerEnvs,
} from '../src/docker-parse-command';

describe('Docker Command Parser and Builder', () => {
  const baseArg = {
    name: '',
    path: '',
    prefix: '',
    protocol: '',
    type: 'docker',
    proxyBehavior: 'service',
  };
  const baseEnv = {
    secure: false,
    shared: false,
    required: false,
    custom: '',
    description: '',
  };
  describe('dockerParseCommand', () => {
    it('should return empty args and empty image name for empty command', () => {
      const command = '';
      const result = dockerParseCommand(command);
      expect(result).toEqual({ dockerArgs: [], dockerEnvs: [], dockerImage: '', dockerCommand: '' });
    });

    it('should return empty args and empty image name for command without docker run', () => {
      const command = 'echo "Hello World"';
      const result = dockerParseCommand(command);
      expect(result).toEqual({ dockerArgs: [], dockerEnvs: [], dockerImage: '', dockerCommand: '' });
    });

    it('should parse simple docker run command', () => {
      const command = 'docker run ubuntu';
      const result = dockerParseCommand(command);
      expect(result).toEqual({
        dockerArgs: [],
        dockerEnvs: [],
        dockerImage: 'ubuntu',
        dockerCommand: '',
      });
    });

    it('should parse docker run command with environment variables', () => {
      const command = 'docker run -e ENV_VAR1=value1 --env ENV_VAR2="value two" ubuntu';
      const result = dockerParseCommand(command);
      expect(result).toEqual({
        dockerArgs: [],
        dockerEnvs: [
          { ...baseEnv, key: 'ENV_VAR1', value: 'value1' },
          { ...baseEnv, key: 'ENV_VAR2', value: 'value two' },
        ],
        dockerImage: 'ubuntu',
        dockerCommand: '',
      });
    });

    it('should parse docker run command without blocklet port', () => {
      const command = 'docker run -p 8080:80 -p 8081:81 -p 8081:81/udp -e ENV_VAR1=value1 -e ENV_VAR2=value2 ubuntu';
      const result = dockerParseCommand(command);
      expect(result).toEqual({
        dockerArgs: [
          { ...baseArg, key: '--publish', value: '8080:80', type: 'web' },
          { ...baseArg, key: '--publish', value: '8081:81' },
          { ...baseArg, key: '--publish', value: '8081:81/udp' },
        ],
        dockerEnvs: [
          { ...baseEnv, key: 'ENV_VAR1', value: 'value1' },
          { ...baseEnv, key: 'ENV_VAR2', value: 'value2' },
        ],
        dockerImage: 'ubuntu',
        dockerCommand: '',
      });
    });

    it('should parse docker ignore port error', () => {
      const command = 'docker run -p -p 8081:81 -p 8081:81/udp -e ENV_VAR1=value1 -e ENV_VAR2=value2 ubuntu';
      const result = dockerParseCommand(command);
      expect(result).toEqual({
        dockerArgs: [
          { ...baseArg, key: '--publish', value: '8081:81', type: 'web' },
          { ...baseArg, key: '--publish', value: '8081:81/udp' },
        ],
        dockerEnvs: [
          { ...baseEnv, key: 'ENV_VAR1', value: 'value1' },
          { ...baseEnv, key: 'ENV_VAR2', value: 'value2' },
        ],
        dockerImage: 'ubuntu',
        dockerCommand: '',
      });
    });

    it('should parse docker run command with various arguments', () => {
      const command = `
        docker run -d -p 8080:80 \\
        --dog the-dog \\
        --volume /host/path:/container/path \\
        --env ENV_VAR="some value" \\
        --env ENV_VAR2="some value2" \\
        ubuntu
      `;
      const result = dockerParseCommand(command);
      expect(result).toEqual({
        dockerArgs: [
          { ...baseArg, key: '--detach', value: 'true' },
          { ...baseArg, key: '--publish', value: '8080:80', type: 'web' },
          { ...baseArg, key: '--volume', value: '$BLOCKLET_DATA_DIR/host/path:/container/path' },
        ],
        dockerEnvs: [
          { ...baseEnv, key: 'ENV_VAR', value: 'some value' },
          { ...baseEnv, key: 'ENV_VAR2', value: 'some value2' },
        ],
        dockerImage: 'ubuntu',
        dockerCommand: '',
      });
    });

    it('should handle quoted arguments correctly', () => {
      const command = "docker run --env ENV_VAR='complex value' ubuntu";
      const result = dockerParseCommand(command);
      expect(result).toEqual({
        dockerArgs: [],
        dockerEnvs: [{ ...baseEnv, key: 'ENV_VAR', value: 'complex value' }],
        dockerImage: 'ubuntu',
        dockerCommand: '',
      });
    });

    it('should ignore unrecognized arguments', () => {
      const command = 'docker run --unknown-flag value ubuntu';
      const result = dockerParseCommand(command);
      expect(result).toEqual({
        dockerArgs: [],
        dockerEnvs: [],
        dockerImage: 'ubuntu',
        dockerCommand: '',
      });
    });

    // 处理实际案例测试
    describe('parseDockerCommand real case tests', () => {
      it('should parse the first docker run command correctly', () => {
        const command = `
          docker run \\
          --rm -it \\
          --expose=53 \\
          --expose=53/udp -p 53:53 -p 53:53/udp \\
          --env OMADA_URL="<OMADA_URL>" \\
          --env OMADA_SITE="<OMADA_SITE>" \\
          --env OMADA_USERNAME="<OMADA_USERNAME>" \\
          --env OMADA_PASSWORD="<OMADA_PASSWORD>" \\
          --env OMADA_DISABLE_HTTPS_VERIFICATION="false" \\
          --env UPSTREAM_DNS="8.8.8.8" \\
          ghcr.io/dougbw/coredns_omada:latest
        `;
        const result = dockerParseCommand(command);

        expect(result).toEqual({
          dockerArgs: [
            { ...baseArg, key: '--rm', value: 'true' },
            { ...baseArg, key: '-it', value: 'true' },
            { ...baseArg, key: '--expose', value: '53' },
            { ...baseArg, key: '--expose', value: '53/udp' },
            { ...baseArg, key: '--publish', value: '53:53', type: 'web' },
            { ...baseArg, key: '--publish', value: '53:53/udp' },
          ],
          dockerEnvs: [
            { ...baseEnv, key: 'OMADA_URL', value: '<OMADA_URL>' },
            { ...baseEnv, key: 'OMADA_SITE', value: '<OMADA_SITE>' },
            { ...baseEnv, key: 'OMADA_USERNAME', value: '<OMADA_USERNAME>' },
            { ...baseEnv, key: 'OMADA_PASSWORD', value: '<OMADA_PASSWORD>' },
            { ...baseEnv, key: 'OMADA_DISABLE_HTTPS_VERIFICATION', value: 'false' },
            { ...baseEnv, key: 'UPSTREAM_DNS', value: '8.8.8.8' },
          ],
          dockerImage: 'ghcr.io/dougbw/coredns_omada:latest',
          dockerCommand: '',
        });
      });

      it('should parse the second docker run command correctly', () => {
        const command = `
          docker run -d \\
            --name frigate \\
            --restart=unless-stopped \\
            --mount type=tmpfs,target=/tmp/cache,tmpfs-size=1000000000 \\
            --device /dev/bus/usb:/dev/bus/usb \\
            --device /dev/dri/renderD128 \\
            --shm-size=64m \\
            -v /path/to/your/storage:/media/frigate \\
            -v /path/to/your/config:/config \\
            -v /etc/localtime:/etc/localtime:ro \\
            -e FRIGATE_RTSP_PASSWORD='password' \\
            -p 8971:8971 \\
            -p 8554:8554 \\
            -p 8555:8555/tcp \\
            -p 8555:8555/udp \\
            ghcr.io/blakeblackshear/frigate:stable
        `;
        const result = dockerParseCommand(command);
        expect(result).toEqual({
          dockerArgs: [
            { ...baseArg, key: '--detach', value: 'true' },
            { ...baseArg, key: '--name', value: 'frigate' },
            { ...baseArg, key: '--restart', value: 'unless-stopped' },
            { ...baseArg, key: '--mount', value: 'type=tmpfs,target=/tmp/cache,tmpfs-size=1000000000' },
            { ...baseArg, key: '--device', value: '/dev/bus/usb:/dev/bus/usb' },
            { ...baseArg, key: '--device', value: '/dev/dri/renderD128' },
            { ...baseArg, key: '--shm-size', value: '64m' },
            { ...baseArg, key: '--volume', value: '$BLOCKLET_DATA_DIR/path/to/your/storage:/media/frigate' },
            { ...baseArg, key: '--volume', value: '$BLOCKLET_DATA_DIR/path/to/your/config:/config' },
            { ...baseArg, key: '--volume', value: '$BLOCKLET_DATA_DIR/etc/localtime:/etc/localtime:ro' },
            { ...baseArg, key: '--publish', value: '8971:8971', type: 'web' },
            { ...baseArg, key: '--publish', value: '8554:8554' },
            { ...baseArg, key: '--publish', value: '8555:8555/tcp' },
            { ...baseArg, key: '--publish', value: '8555:8555/udp' },
          ],
          dockerEnvs: [{ ...baseEnv, key: 'FRIGATE_RTSP_PASSWORD', value: 'password' }],
          dockerImage: 'ghcr.io/blakeblackshear/frigate:stable',
          dockerCommand: '',
        });
      });

      it('should parse the third docker run command correctly', () => {
        const command = `
          docker run -d \\
            --name omada-controller \\
            --stop-timeout 60 \\
            --restart unless-stopped \\
            --ulimit nofile=4096:8192 \\
            -p 8088:8088 \\
            -p 8043:8043 \\
            -e MANAGE_HTTP_PORT=8088 \\
            -e MANAGE_HTTPS_PORT=8043 \\
            -e PGID="508" \\
            -e PORTAL_HTTP_PORT=8088 \\
            -e PORTAL_HTTPS_PORT=8843 \\
            -e PORT_ADOPT_V1=29812 \\
            -e PORT_APP_DISCOVERY=27001 \\
            -e PORT_DISCOVERY=29810 \\
            -e PORT_MANAGER_V1=29811 \\
            -e PORT_MANAGER_V2=29814 \\
            -e PORT_TRANSFER_V2=29815 \\
            -e PORT_RTTY=29816 \\
            -e PORT_UPGRADE_V1=29813 \\
            -e PUID="508" \\
            -e SHOW_SERVER_LOGS=true \\
            -e SHOW_MONGODB_LOGS=false \\
            -e SSL_CERT_NAME="tls.crt" \\
            -e SSL_KEY_NAME="tls.key" \\
            -e TZ=Etc/UTC \\
            -v omada-data:/opt/tplink/EAPController/data \\
            -v omada-logs:/opt/tplink/EAPController/logs \\
            mbentley/omada-controller:5.15
        `;
        const result = dockerParseCommand(command);

        expect(result).toEqual({
          dockerArgs: [
            { ...baseArg, key: '--detach', value: 'true' },
            { ...baseArg, key: '--name', value: 'omada-controller' },
            { ...baseArg, key: '--stop-timeout', value: '60' },
            { ...baseArg, key: '--restart', value: 'unless-stopped' },
            { ...baseArg, key: '--ulimit', value: 'nofile=4096:8192' },
            { ...baseArg, key: '--publish', value: '8088:8088', type: 'web' },
            { ...baseArg, key: '--publish', value: '8043:8043' },
            { ...baseArg, key: '--volume', value: 'omada-data:/opt/tplink/EAPController/data' },
            { ...baseArg, key: '--volume', value: 'omada-logs:/opt/tplink/EAPController/logs' },
          ],
          dockerEnvs: [
            { ...baseEnv, key: 'MANAGE_HTTP_PORT', value: '8088' },
            { ...baseEnv, key: 'MANAGE_HTTPS_PORT', value: '8043' },
            { ...baseEnv, key: 'PGID', value: '508' },
            { ...baseEnv, key: 'PORTAL_HTTP_PORT', value: '8088' },
            { ...baseEnv, key: 'PORTAL_HTTPS_PORT', value: '8843' },
            { ...baseEnv, key: 'PORT_ADOPT_V1', value: '29812' },
            { ...baseEnv, key: 'PORT_APP_DISCOVERY', value: '27001' },
            { ...baseEnv, key: 'PORT_DISCOVERY', value: '29810' },
            { ...baseEnv, key: 'PORT_MANAGER_V1', value: '29811' },
            { ...baseEnv, key: 'PORT_MANAGER_V2', value: '29814' },
            { ...baseEnv, key: 'PORT_TRANSFER_V2', value: '29815' },
            { ...baseEnv, key: 'PORT_RTTY', value: '29816' },
            { ...baseEnv, key: 'PORT_UPGRADE_V1', value: '29813' },
            { ...baseEnv, key: 'PUID', value: '508' },
            { ...baseEnv, key: 'SHOW_SERVER_LOGS', value: 'true' },
            { ...baseEnv, key: 'SHOW_MONGODB_LOGS', value: 'false' },
            { ...baseEnv, key: 'SSL_CERT_NAME', value: 'tls.crt' },
            { ...baseEnv, key: 'SSL_KEY_NAME', value: 'tls.key' },
            { ...baseEnv, key: 'TZ', value: 'Etc/UTC' },
          ],
          dockerImage: 'mbentley/omada-controller:5.15',
          dockerCommand: '',
        });
      });
    });
  });

  describe('dockerBuildCommand', () => {
    it('should return empty string when no args are provided and no image name', () => {
      const args = { dockerArgs: [] as DockerArgs, dockerEnvs: [] as DockerEnvs, dockerImage: '', dockerCommand: '' };
      const command = dockerBuildCommand(args);
      expect(command).toBe('');
    });

    it('should build simple docker run command', () => {
      const args = {
        dockerArgs: [] as DockerArgs,
        dockerEnvs: [] as DockerEnvs,
        dockerImage: 'ubuntu',
        dockerCommand: '',
      };
      const command = dockerBuildCommand(args);
      expect(command).toBe('docker run \\\n  ubuntu');
    });

    it('should build docker run command with environment variables', () => {
      const args = {
        dockerArgs: [] as DockerArgs,
        dockerEnvs: [
          { ...baseEnv, key: 'ENV_VAR1', value: 'value1', type: 'web' },
          { ...baseEnv, key: 'ENV_VAR2', value: 'value two' },
        ],
        dockerImage: 'ubuntu',
        dockerCommand: '',
      };
      const command = dockerBuildCommand(args);
      expect(command).toBe(
        'docker run \\\n' + '  -e ENV_VAR1="value1" \\\n' + '  -e ENV_VAR2="value two" \\\n' + '  ubuntu'
      );
    });

    it('should build docker run command with various arguments', () => {
      const args = {
        dockerArgs: [
          { ...baseArg, key: '--detach', value: 'true' },
          { ...baseArg, key: '--publish', value: '8080:80', type: 'web' },
          { ...baseArg, key: '--volume', value: '/host/path:/container/path' },
        ],
        dockerEnvs: [{ ...baseEnv, key: 'ENV_VAR', value: 'some value' }],
        dockerImage: 'ubuntu',
        dockerCommand: '',
      };
      const command = dockerBuildCommand(args);
      expect(command).toBe(
        'docker run \\\n' +
          '  --detach \\\n' +
          '  --publish 8080:80 \\\n' +
          '  --volume /host/path:/container/path \\\n' +
          '  -e ENV_VAR="some value" \\\n' +
          '  ubuntu'
      );
    });

    it('should handle boolean flags correctly', () => {
      const args = {
        dockerArgs: [
          { ...baseArg, key: '--detach', value: 'true' },
          { ...baseArg, key: '--interactive', value: 'true' },
        ],
        dockerEnvs: [] as DockerEnvs,
        dockerImage: 'ubuntu',
        dockerCommand: '',
      };
      const command = dockerBuildCommand(args);
      expect(command).toBe('docker run \\\n' + '  --detach \\\n' + '  --interactive \\\n' + '  ubuntu');
    });

    // 处理实际案例测试
    describe('buildDockerCommand real case tests', () => {
      it('should build the first docker run command correctly', () => {
        const args = {
          dockerArgs: [
            { ...baseArg, key: '--rm', value: 'true' },
            { ...baseArg, key: '--interactive', value: 'true' },
            { ...baseArg, key: '--expose', value: '53/udp' },
            { ...baseArg, key: '--publish', value: '53:53/udp', type: 'web' },
          ],
          dockerEnvs: [
            { ...baseEnv, key: 'OMADA_URL', value: '<OMADA_URL>' },
            { ...baseEnv, key: 'OMADA_SITE', value: '<OMADA_SITE>' },
            { ...baseEnv, key: 'OMADA_USERNAME', value: '<OMADA_USERNAME>' },
            { ...baseEnv, key: 'OMADA_PASSWORD', value: '<OMADA_PASSWORD>' },
            { ...baseEnv, key: 'OMADA_DISABLE_HTTPS_VERIFICATION', value: 'false' },
            { ...baseEnv, key: 'UPSTREAM_DNS', value: '8.8.8.8' },
          ],
          dockerImage: 'ghcr.io/dougbw/coredns_omada:latest',
          dockerCommand: '',
        };
        const command = dockerBuildCommand(args);
        const expectedCommand =
          'docker run \\\n' +
          '  --rm \\\n' +
          '  --interactive \\\n' +
          '  --expose 53/udp \\\n' +
          '  --publish 53:53/udp \\\n' +
          '  -e OMADA_URL="<OMADA_URL>" \\\n' +
          '  -e OMADA_SITE="<OMADA_SITE>" \\\n' +
          '  -e OMADA_USERNAME="<OMADA_USERNAME>" \\\n' +
          '  -e OMADA_PASSWORD="<OMADA_PASSWORD>" \\\n' +
          '  -e OMADA_DISABLE_HTTPS_VERIFICATION="false" \\\n' +
          '  -e UPSTREAM_DNS="8.8.8.8" \\\n' +
          '  ghcr.io/dougbw/coredns_omada:latest';
        expect(command).toBe(expectedCommand);
      });

      it('should build the second docker run command correctly', () => {
        const args = {
          dockerArgs: [
            { ...baseArg, key: '--detach', value: 'true' },
            { ...baseArg, key: '--name', value: 'frigate' },
            { ...baseArg, key: '--restart', value: 'unless-stopped' },
            { ...baseArg, key: '--mount', value: 'type=tmpfs,target=/tmp/cache,tmpfs-size=1000000000' },
            { ...baseArg, key: '--device', value: '/dev/bus/usb:/dev/bus/usb' },
            { ...baseArg, key: '--device', value: '/dev/dri/renderD128' },
            { ...baseArg, key: '--shm-size', value: '64m' },
            { ...baseArg, key: '--volume', value: '/path/to/your/storage:/media/frigate' },
            { ...baseArg, key: '--volume', value: '/path/to/your/config:/config' },
            { ...baseArg, key: '--volume', value: '/etc/localtime:/etc/localtime:ro' },
            { ...baseArg, key: '--publish', value: '8555/udp' },
          ],
          dockerEnvs: [{ ...baseEnv, key: 'FRIGATE_RTSP_PASSWORD', value: 'password' }],
          dockerImage: 'ghcr.io/blakeblackshear/frigate:stable',
          dockerCommand: '',
        };
        const command = dockerBuildCommand(args);
        const expectedCommand =
          'docker run \\\n' +
          '  --detach \\\n' +
          '  --name frigate \\\n' +
          '  --restart unless-stopped \\\n' +
          '  --mount type=tmpfs,target=/tmp/cache,tmpfs-size=1000000000 \\\n' +
          '  --device /dev/bus/usb:/dev/bus/usb \\\n' +
          '  --device /dev/dri/renderD128 \\\n' +
          '  --shm-size 64m \\\n' +
          '  --volume /path/to/your/storage:/media/frigate \\\n' +
          '  --volume /path/to/your/config:/config \\\n' +
          '  --volume /etc/localtime:/etc/localtime:ro \\\n' +
          '  --publish 8555/udp \\\n' +
          '  -e FRIGATE_RTSP_PASSWORD="password" \\\n' +
          '  ghcr.io/blakeblackshear/frigate:stable';
        expect(command).toBe(expectedCommand);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should parse and build back', () => {
      const originalCommand = `
        docker run \\
        --rm -it \\
        --expose=53 --expose=53/udp -p 53:53 -p 53:53/udp \\
        --env OMADA_URL="<OMADA_URL>" \\
        --env OMADA_SITE="<OMADA_SITE>" \\
        --env OMADA_USERNAME="<OMADA_USERNAME>" \\
        --env OMADA_PASSWORD="<OMADA_PASSWORD>" \\
        --env OMADA_DISABLE_HTTPS_VERIFICATION="false" \\
        --env UPSTREAM_DNS="8.8.8.8" \\
        ghcr.io/dougbw/coredns_omada:latest
      `;
      const parsed = dockerParseCommand(originalCommand);
      const rebuiltCommand = dockerBuildCommand({
        dockerArgs: parsed.dockerArgs,
        dockerEnvs: parsed.dockerEnvs,
        dockerImage: parsed.dockerImage,
        dockerCommand: parsed.dockerCommand,
      });
      const expectedCommand =
        'docker run \\\n' +
        '  --rm \\\n' +
        '  -it \\\n' +
        '  --expose 53 \\\n' +
        '  --expose 53/udp \\\n' +
        '  --publish 53:53 \\\n' +
        '  --publish 53:53/udp \\\n' +
        '  -e OMADA_URL="<OMADA_URL>" \\\n' +
        '  -e OMADA_SITE="<OMADA_SITE>" \\\n' +
        '  -e OMADA_USERNAME="<OMADA_USERNAME>" \\\n' +
        '  -e OMADA_PASSWORD="<OMADA_PASSWORD>" \\\n' +
        '  -e OMADA_DISABLE_HTTPS_VERIFICATION="false" \\\n' +
        '  -e UPSTREAM_DNS="8.8.8.8" \\\n' +
        '  ghcr.io/dougbw/coredns_omada:latest';
      expect(rebuiltCommand).toBe(expectedCommand);
    });

    it('should handle commands without docker run gracefully', () => {
      const originalCommand = 'echo "Hello World"';
      const parsed = dockerParseCommand(originalCommand);
      expect(parsed).toEqual({ dockerArgs: [], dockerEnvs: [], dockerImage: '', dockerCommand: '' });
      const rebuiltCommand = dockerBuildCommand(parsed);
      expect(rebuiltCommand).toBe('');
    });
  });

  describe('Integration Tests', () => {
    it('should parse and build back, handle command', () => {
      const originalCommand = 'docker run ghcr.io/xxx/xxx --foo=bar xyz';
      const parsed = dockerParseCommand(originalCommand);
      expect(parsed).toEqual({
        dockerArgs: [],
        dockerEnvs: [],
        dockerImage: 'ghcr.io/xxx/xxx',
        dockerCommand: '--foo=bar xyz',
      });
      const rebuiltCommand = dockerBuildCommand({
        dockerArgs: parsed.dockerArgs,
        dockerEnvs: parsed.dockerEnvs,
        dockerImage: parsed.dockerImage,
        dockerCommand: parsed.dockerCommand,
      });
      const expectedCommand = 'docker run \\\n  ghcr.io/xxx/xxx \\\n  --foo=bar xyz';
      expect(rebuiltCommand).toBe(expectedCommand);
    });

    it('should parse and build the first docker run command correctly', () => {
      const originalCommand = 'docker run --name dog ghcr.io/xxx/xxx --foo=bar xyz';
      const parsed = dockerParseCommand(originalCommand);
      expect(parsed).toEqual({
        dockerArgs: [
          {
            key: '--name',
            name: '',
            path: '',
            prefix: '',
            protocol: '',
            type: 'docker',
            proxyBehavior: 'service',
            value: 'dog',
          },
        ],
        dockerEnvs: [],
        dockerImage: 'ghcr.io/xxx/xxx',
        dockerCommand: '--foo=bar xyz',
      });
      const rebuiltCommand = dockerBuildCommand({
        dockerArgs: parsed.dockerArgs,
        dockerEnvs: parsed.dockerEnvs,
        dockerImage: parsed.dockerImage,
        dockerCommand: parsed.dockerCommand,
      });
      const expectedCommand = 'docker run \\\n  --name dog \\\n  ghcr.io/xxx/xxx \\\n  --foo=bar xyz';
      expect(rebuiltCommand).toBe(expectedCommand);
    });
  });

  describe('is volume path', () => {
    it('should return true if the path is a volume path', () => {
      [
        '/path/to/your/storage',
        './path/to/your/storage',
        '../path/to/your/storage',
        '~/path/to/your/storage',
        '$BLOCKLET_APP_DIR/path/to/your/storage',
        '$BLOCKLET_DATA_DIR/path/to/your/storage',
      ].forEach((path) => {
        expect(isVolumePath(path)).toBe(true);
      });
    });

    it('should return false if the path is not a volume path', () => {
      ['dog:/fff', 'cat:/eee', 'fish:/ooo'].forEach((path) => {
        expect(isVolumePath(path)).toBe(false);
      });
    });
  });
});
