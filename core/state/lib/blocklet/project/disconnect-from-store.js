const disconnectFromStore = async ({ did, storeId, projectId, manager, storeScope, context }) => {
  if (!did) {
    throw new Error('Invalid did');
  }
  const { projectState } = await manager._getProjectState(did);
  return projectState.deleteConnectedStore({
    projectId,
    storeId,
    createdBy: storeScope === 'studio' ? null : context?.user?.did,
  });
};

module.exports = disconnectFromStore;
