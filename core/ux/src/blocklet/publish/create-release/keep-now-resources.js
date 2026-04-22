function keepNowResources(trees, list) {
  const listSet = new Set(list || []);
  const result = [];

  function traverse(tree) {
    if (listSet.has(tree?.id)) {
      result.push(tree?.id);
    }
    if (tree?.children) {
      tree.children.forEach(traverse);
    }
  }

  (trees || []).forEach(traverse);
  return result;
}

export default keepNowResources;
