const isCodespaces = () => {
  return process.env.CODESPACES === 'true';
};

const getDomain = (port) => {
  return `${process.env.CODESPACE_NAME}-${port}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`;
};

const getAccessUrl = ({ protocol = 'https', port, pathName }) => {
  if (!isCodespaces()) {
    return '';
  }

  const url = new URL(`${protocol}://${getDomain(port)}`);

  if (pathName) {
    url.pathname = pathName;
  }

  return url.toString();
};

module.exports = {
  isCodespaces,
  getAccessUrl,
  getDomain,
};
