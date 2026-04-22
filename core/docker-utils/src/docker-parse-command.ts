/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */
/* eslint-disable no-lonely-if */
import { whiteDockerArgs } from './docker-args';

export type DockerArgs = {
  key: string;
  value: string;
  type?: string;
  name?: string;
  path?: string;
  prefix?: string;
  protocol?: string;
  proxyBehavior?: string;
}[];

export type DockerEnvs = {
  key: string;
  value: string;
  description?: string;
  secure?: boolean;
  shared?: boolean;
  required?: boolean;
  custom?: string;
}[];

const needValueKeys = new Set(['--publish', '--volume']);

export const isVolumePath = (volume: string) => {
  const [hostPart] = volume.split(':');
  return (
    hostPart?.startsWith('/') ||
    hostPart?.startsWith('./') ||
    hostPart?.startsWith('../') ||
    hostPart?.startsWith('~') ||
    hostPart?.startsWith('$BLOCKLET')
  );
};

export function addBlockletPrefixVolume(args: DockerArgs): DockerArgs {
  return args.map((arg) => {
    if (arg.key !== '--volume') return arg;

    // 已经带了 $BLOCKLET_APP_DIR / $BLOCKLET_DATA_DIR，直接返回
    if (arg.value.startsWith('$BLOCKLET_APP_DIR/') || arg.value.startsWith('$BLOCKLET_DATA_DIR/')) {
      return arg;
    }

    // 拆分 hostPart:containerPart[:options]
    const [hostPart, ...rest] = arg.value.split(':');
    if (!hostPart) {
      return arg;
    }

    if (!isVolumePath(arg.value)) {
      return arg;
    }

    // 路径 → 加 $BLOCKLET_DATA_DIR 前缀
    const newHostPart = hostPart.startsWith('/') ? `$BLOCKLET_DATA_DIR${hostPart}` : `$BLOCKLET_DATA_DIR/${hostPart}`;

    return { ...arg, value: [newHostPart, ...rest].join(':') };
  });
}

function parseFirstPublishWeb(args: DockerArgs): DockerArgs {
  let firstPublish = true;
  const hasWebType = args.find((arg) => arg.key === '--publish' && arg.type === 'web');
  if (hasWebType) {
    return args.map((arg) => {
      if (arg.key === '--publish') {
        const next = { ...arg, type: firstPublish ? 'docker' : arg.type };
        firstPublish = arg.type === 'web';
        return next;
      }

      return arg;
    });
  }
  return args.map((arg) => {
    if (arg.key === '--publish') {
      const next = { ...arg, type: firstPublish ? 'web' : 'docker' };
      firstPublish = false;
      return next;
    }

    return arg;
  });
}

export function dockerParseCommand(command: string): {
  dockerArgs: DockerArgs;
  dockerEnvs: DockerEnvs;
  dockerImage: string;
  dockerCommand: string;
} {
  if (!command) {
    return { dockerArgs: [], dockerEnvs: [], dockerImage: '', dockerCommand: '' };
  }

  command = command.trim();
  if (command.startsWith('$ docker run')) {
    command = command.replace('$ docker run', 'docker run');
  }
  if (!command.startsWith('docker run')) {
    return { dockerArgs: [], dockerEnvs: [], dockerImage: '', dockerCommand: '' };
  }

  // 移除续行符和换行符，将整个命令合并为单行
  const cleanedCommand = command.replace(/\\\n/g, '').replace(/\n/g, ' ').trim();

  // 匹配命令部分，同时处理单引号和双引号
  const parts = cleanedCommand.match(/(?:[^\s"']+|'[^']*'|"[^"]*")+/g);

  if (!parts) {
    return { dockerArgs: [], dockerEnvs: [], dockerImage: '', dockerCommand: '' };
  }

  const dockerArgs: DockerArgs = [];
  const dockerEnvs: DockerEnvs = [];

  let i = 0;
  let dockerImage = '';
  let dockerCommand = '';
  const lastArgs: string[] = [];

  while (i < parts.length) {
    const part = parts[i];
    if (!part) {
      i++;
      continue;
    }

    // 忽略 'docker' 和 'run'
    if (part === 'docker' || part === 'run') {
      i++;
      continue;
    }

    // 处理环境变量参数 '-e' 或 '--env'
    if ((part === '-e' || part === '--env') && i + 1 < parts.length) {
      const envString = parts[i + 1] || '';
      const [envKey, ...envValueParts] = envString.split('=');
      if (envKey) {
        const envValue = envValueParts.join('=').replace(/^['"]|['"]$/g, '');
        dockerEnvs.push({ key: envKey, value: envValue });
      }
      i += 2;
      continue;
    }

    // 处理其他 Docker 参数
    if (part.startsWith('-') && lastArgs.length === 0) {
      const equalIndex = part.indexOf('=');
      let rawKey = part;
      let value: string | null = null;

      if (equalIndex !== -1) {
        // 处理类似 --expose=53 的情况
        rawKey = part.substring(0, equalIndex);
        value = part.substring(equalIndex + 1).replace(/^['"]|['"]$/g, '');
      }

      const fullKey = whiteDockerArgs[rawKey];
      if (!fullKey) {
        // 如果参数不在白名单中，直接跳过 (同时要跳过 value)
        i += 2;
        continue;
      }

      if (fullKey === '--publish') {
        // 处理 --publish 参数，不进行任何替换
        let publishValue = '';

        if (value) {
          // 处理类似 --publish=53:53/udp 的情况
          publishValue = value;
          dockerArgs.push({ key: fullKey, value: publishValue });
        } else {
          // 参数和值分开，或者布尔参数
          if (i + 1 < parts.length && !(parts[i + 1] || '').startsWith('-')) {
            const nextVal = (parts[i + 1] || '').replace(/^['"]|['"]$/g, '');
            publishValue = nextVal;
            dockerArgs.push({ key: fullKey, value: publishValue });
            i += 2;
            continue;
          } else {
            // 布尔参数，标记为 'true'
            dockerArgs.push({ key: fullKey, value: 'true' });
            i++;
            continue;
          }
        }
        i++;
        continue;
      }

      if (value !== null) {
        // 参数和值在同一个部分
        dockerArgs.push({ key: fullKey, value });
        i++;
        continue;
      } else {
        // 参数和值分开，或布尔参数
        if (i + 1 < parts.length && !(parts[i + 1] || '').startsWith('-')) {
          const nextVal = (parts[i + 1] || '').replace(/^['"]|['"]$/g, '');
          dockerArgs.push({ key: fullKey, value: nextVal });
          i += 2;
          continue;
        } else {
          dockerArgs.push({ key: fullKey, value: 'true' });
          i++;
          continue;
        }
      }
    }

    lastArgs.push(part);
    i++;
  }
  dockerImage = lastArgs[0] || '';
  dockerCommand = lastArgs.slice(1).join(' ');
  const filteredDockerArgs: DockerArgs = [];
  for (const arg of dockerArgs) {
    arg.name = '';
    arg.path = '';
    arg.prefix = '';
    arg.protocol = '';
    arg.proxyBehavior = 'service';
    arg.type = 'docker';
    if (needValueKeys.has(arg.key) && arg.value === 'true') {
      continue;
    }
    filteredDockerArgs.push(arg);
  }
  for (const item of dockerEnvs) {
    item.custom = '';
    item.description = '';
    item.secure = false;
    item.shared = false;
    item.required = false;
  }

  return {
    dockerArgs: parseFirstPublishWeb(addBlockletPrefixVolume(filteredDockerArgs)),
    dockerEnvs,
    dockerImage,
    dockerCommand,
  };
}

export function dockerBuildCommand({
  dockerArgs,
  dockerEnvs,
  dockerImage,
  dockerCommand,
}: {
  dockerArgs: DockerArgs;
  dockerEnvs: DockerEnvs;
  dockerImage: string;
  dockerCommand: string;
}): string {
  if (dockerArgs.length === 0 && dockerEnvs.length === 0 && !dockerImage) {
    return '';
  }

  const parts: string[] = ['docker run \\'];

  // 定义哪些参数可以多次出现
  const multipleArgs = new Set([
    '--publish',
    '--volume',
    '--expose',
    '--device',
    '--mount',
    '--label',
    '--cap-add',
    '--cap-drop',
    '--add-host',
    '--dns',
    '--network-alias',
    '--sysctl',
    '--ulimit',
    '--network',
  ]);

  // 处理 dockerArgs
  for (const arg of dockerArgs) {
    const { key, value } = arg;

    if (multipleArgs.has(key)) {
      if (value === 'true') {
        parts.push(`  ${key} \\`);
      } else {
        // 如果值包含空格或特殊字符，添加引号
        const formattedValue = /[\s"']/g.test(value) ? `"${value}"` : value;
        parts.push(`  ${key} ${formattedValue} \\`);
      }
    } else {
      // 对于不可重复参数，只使用第一个出现的值
      if (!parts.some((part) => part.startsWith(`  ${key}`))) {
        if (value === 'true') {
          parts.push(`  ${key} \\`);
        } else {
          // 如果值包含空格或特殊字符，添加引号
          const formattedValue = /[\s"']/g.test(value) ? `"${value}"` : value;
          parts.push(`  ${key} ${formattedValue} \\`);
        }
      }
    }
  }

  // 处理 dockerEnv
  for (const env of dockerEnvs) {
    const { key, value } = env;
    // 如果值包含空格或特殊字符，添加引号
    const formattedEnvValue = /["']/g.test(value) ? value : `"${value}"`;
    parts.push(`  -e ${key}=${formattedEnvValue} \\`);
  }

  if (dockerImage) {
    parts.push(`  ${dockerImage} \\`);
  }
  if (dockerCommand) {
    parts.push(`  ${dockerCommand} \\`);
  }
  // 移除最后的续行符
  if (parts[parts.length - 1]?.endsWith(' \\')) {
    parts[parts.length - 1] = (parts[parts.length - 1] || '').slice(0, -2);
  }

  return parts.join('\n');
}
