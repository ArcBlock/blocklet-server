const getScope = (args = {}) => {
  // this param usually means mutating an application (server or blocklet)
  if (args.teamDid) {
    return args.teamDid;
  }

  // this param usually means mutating a child component
  if (args.rootDid) {
    return args.rootDid;
  }

  // this param usually means mutating a blockle application
  if (args.did) {
    // this param usually means mutating a nested child component
    if (Array.isArray(args.did)) {
      return args.did[0];
    }

    return args.did;
  }

  return null;
};

module.exports = {
  getScope,
};
