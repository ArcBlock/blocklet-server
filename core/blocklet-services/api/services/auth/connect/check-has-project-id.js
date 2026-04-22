const authPrincipal = ({ extraParams: { projectId, name } }) => {
  return {
    description: `Are you sure you want to delete ${name} project?`,
    supervised: true,
    target: projectId,
  };
};

const createRoutes = (node) => {
  return {
    action: 'check-has-project-id',
    authPrincipal: false,
    claims: [{ authPrincipal }],
    onAuth: async ({ updateSession, extraParams }) => {
      const { projectId, did } = extraParams;
      await node.deleteProject({ projectId, did });
      await updateSession({ deleted: true });
    },
  };
};

module.exports = createRoutes;
