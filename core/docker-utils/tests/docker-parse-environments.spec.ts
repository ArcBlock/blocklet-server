import { it, expect, describe } from 'bun:test';
import { dockerParseCommand } from '../src/docker-parse-command';
import { dockerParseEnvironments } from '../src/docker-parse-environments';

describe('Docker Parse Environments', () => {
  it('should parse docker run command with environment variables', () => {
    const command = 'docker run -e ENV_VAR1=value1 --env ENV_VAR2="value two" --env ENV_VAR3=$ENV_VAR3 dog';
    const result = dockerParseCommand(command);
    const envs = dockerParseEnvironments(result.dockerEnvs);
    expect(envs).toEqual([
      {
        name: 'ENV_VAR1',
        default: 'value1',
        secure: false,
        shared: false,
        required: false,
        description: 'ENV_VAR1',
        custom: '',
      },
      {
        name: 'ENV_VAR2',
        default: 'value two',
        secure: false,
        shared: false,
        required: false,
        description: 'ENV_VAR2',
        custom: '',
      },
      {
        name: 'ENV_VAR3',
        default: '',
        secure: false,
        shared: false,
        required: false,
        description: 'ENV_VAR3',
        custom: '',
      },
    ]);
  });
});
