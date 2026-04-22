module.exports = (args, context, node, action, result) => {
  node.createAuditLog({ action, args, context, result }).catch(err => console.error('create audit log error', err));
};
