const { BlockletStatus } = require('../../../states/blocklet');

const blueGreenGetComponentIds = (blocklet, componentDids) => {
  if (!blocklet) {
    return {
      componentDids: componentDids || [],
      changeToGreen: false,
    };
  }
  const componentDidsSet = new Set(componentDids);
  const runningStatuses = new Set([BlockletStatus.running]);
  const greenComponentIds = [];
  const blueComponentIds = [];

  const activeStatuses = new Set([BlockletStatus.running, BlockletStatus.starting]);
  const children = blocklet.children || [];
  const hasActiveInstance =
    activeStatuses.has(blocklet.status) ||
    activeStatuses.has(blocklet.greenStatus) ||
    children.some((child) => activeStatuses.has(child.status) || activeStatuses.has(child.greenStatus));

  if (!hasActiveInstance) {
    return [
      {
        componentDids: Array.from(componentDidsSet),
        changeToGreen: false,
      },
    ];
  }

  for (const b of children) {
    if (!componentDidsSet.has(b.meta.did)) {
      continue;
    }
    if (runningStatuses.has(b.greenStatus)) {
      greenComponentIds.push(b.meta.did);
    } else {
      blueComponentIds.push(b.meta.did);
    }
  }

  return [
    {
      componentDids: greenComponentIds,
      changeToGreen: false,
    },
    {
      componentDids: blueComponentIds,
      changeToGreen: true,
    },
  ];
};

module.exports = { blueGreenGetComponentIds };
