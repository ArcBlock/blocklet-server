const checkUser = async (req, res, next) => {
  if (req.user) {
    next();
    return;
  }

  const { token } = req;
  await req.ensureUser({ token });
  if (!req.user) {
    res.status(401).json({ error: 'not login' });
  } else {
    next();
  }
};

module.exports = checkUser;
