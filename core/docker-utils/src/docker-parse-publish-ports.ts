import { DockerArgs } from './docker-parse-command';

interface PublishPort {
  type: string;
  name: string;
  path: string;
  port: string;
  containerPort: number;
  hostIP: string;
  prefix: string;
  proxyBehavior: string;
}

export function dockerParsePublishPorts(blockletTitle: string, dockerArgs: DockerArgs): PublishPort[] {
  const updatedDockerArgs: DockerArgs = JSON.parse(JSON.stringify(dockerArgs));
  const hostPortMap = new Map<string, string>();
  let blockletPortIndex = 1;
  const publishPorts: PublishPort[] = [];

  updatedDockerArgs.forEach((arg) => {
    if (arg.key === '--publish') {
      const publishValue = arg.value;
      const parts = publishValue.split(':');

      let hostIP = '127.0.0.1';
      let hostPort = '';
      let containerPort = '';

      if (parts.length === 2) {
        // 格式: hostPort:containerPort
        [hostPort, containerPort] = parts as [string, string];
      } else if (parts.length === 3) {
        // 格式: hostIP:hostPort:containerPort
        [hostIP, hostPort, containerPort] = parts as [string, string, string];
      } else if (parts.length === 1) {
        // 仅指定 containerPort（非标准，但兼容处理）
        containerPort = parts[0] || '';
      }

      // 检查是否已经映射该 hostPort
      let blockletPort = hostPortMap.get(hostPort || '');
      if (!blockletPort) {
        blockletPort = `$BLOCKLET_PORT_${blockletPortIndex++}`;
        hostPortMap.set(hostPort || '', blockletPort);
      }

      if (!publishPorts.find((port) => port.port === hostPort)) {
        const type = arg.type || 'docker';
        const blockletPathName = `${blockletTitle.replace(/\W/g, '-')}-${publishPorts.length + 1}`;
        publishPorts.push({
          type,
          proxyBehavior: arg.proxyBehavior || '',
          name: blockletPathName,
          path: `/${blockletPathName}`,
          port: hostPort || containerPort, // 若未指定 hostPort，则使用 containerPort
          containerPort: Number(containerPort) || 0,
          hostIP,
          prefix: type === 'docker' ? `/${blockletPathName}` : arg.prefix || '*',
        });
      }
    }
  });

  return publishPorts;
}
