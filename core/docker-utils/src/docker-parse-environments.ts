import { DockerEnvs } from './docker-parse-command';

interface DockerEnv {
  name: string;
  default: string;
  secure: boolean;
  shared: boolean;
  required: boolean;
  description: string;
  custom?: string;
}

export function dockerParseEnvironments(envs: DockerEnvs, ignoreCustom = false) {
  const blockletEnvs: DockerEnv[] = [];

  if (!envs) {
    return blockletEnvs;
  }
  for (const env of envs) {
    const item: DockerEnv = {
      name: env.key,
      default: env.value === `$${env.key}` ? '' : env.value,
      secure: env.secure !== undefined ? env.secure : false,
      shared: env.shared !== undefined ? env.shared : false,
      required: env.required !== undefined ? env.required : false,
      description: env.description || env.key,
    };
    if (!ignoreCustom) {
      item.custom = env.custom || '';
    }
    blockletEnvs.push(item);
  }
  return blockletEnvs;
}
