function removeDuplicates(queue: string[][]) {
  const usedDid = new Set();
  for (let i = 0; i < queue.length; i++) {
    for (let j = 0; j < queue[i].length; j++) {
      if (usedDid.has(queue[i][j])) {
        queue[i].splice(j, 1);
        j--;
      } else {
        usedDid.add(queue[i][j]);
      }
    }
  }
  return queue;
}

interface GetRequiredComponentsLayers {
  targetDid: string;
  children: { meta: { did: string }; dependencies: { did: string; required: boolean }[] }[];
  deep?: number;
  filter?: (children) => boolean;
}

// Get the dependency did matrix, the lowest-level dependent did is at the front, and each subsequent layer will be deduplicated
const getRequiredComponentsLayers = ({ targetDid, children, filter, deep = 9 }: GetRequiredComponentsLayers) => {
  if (!children || !children.length) {
    return [];
  }
  const usedDid = new Set<string>();
  const childrenMap = {};
  children.forEach((child) => {
    childrenMap[child.meta.did] = child;
  });
  const getRequiredDependents = (did) => {
    if (usedDid.has(did)) {
      return [];
    }
    usedDid.add(did);
    const child = children.find((x) => x.meta.did === did);
    const dependencies = child?.dependencies || [];
    return dependencies
      .filter((v) => {
        if (!childrenMap[v.did] || !v.required) {
          return false;
        }
        if (filter) {
          return filter(childrenMap[v.did]);
        }
        return true;
      })
      .map((v) => v.did);
  };

  const requiredDependents = getRequiredDependents(targetDid);
  const queue = [requiredDependents];
  for (let i = 0; i < deep - 1; i++) {
    const newDependents = [];
    queue[0].forEach((did) => {
      const dependents = getRequiredDependents(did);
      newDependents.push(...dependents);
    });
    if (newDependents.length) {
      queue.unshift(newDependents);
    }
  }

  return removeDuplicates(queue).filter((v) => v.length);
};

// eslint-disable-next-line import/prefer-default-export
export { getRequiredComponentsLayers };
