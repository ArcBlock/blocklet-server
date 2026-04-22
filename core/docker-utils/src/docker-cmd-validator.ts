const DANGEROUS_CMD = [' -- ', '~', '&', '|', '>', '<', '{', '}', '[', ']', ';', '$', '!', '*', '%', '&&', '||', ','];
const DANGEROUS_CMD_BIN = ['rm ', 'sudo '];

export function dockerCmdValidator(dockerCommand: string) {
  if (dockerCommand === '') {
    return;
  }

  const dangerousPattern = /(\n|\\n|\\\n|\t|\\t|\\\t)/;
  if (dangerousPattern.test(dockerCommand)) {
    throw new Error('Docker CMD is invalid');
  }

  const lowerCaseDockerCommand = dockerCommand.toLocaleLowerCase();
  if (DANGEROUS_CMD_BIN.some((item) => lowerCaseDockerCommand.indexOf(item) !== -1)) {
    throw new Error('Docker CMD is invalid');
  }

  if (DANGEROUS_CMD.some((item) => dockerCommand.indexOf(item) !== -1)) {
    throw new Error('Docker CMD is invalid');
  }

  // eslint-disable-next-line no-useless-escape
  const strictCommandReg = /^(?:(?:[a-zA-Z0-9\-_.\/:=\s]+)|(?:\@{1,2}[a-zA-Z_][a-zA-Z0-9_]*))+$/;

  if (!strictCommandReg.test(dockerCommand)) {
    throw new Error('Docker CMD is invalid');
  }
}
