export default class TreeNode {
  constructor({ data, parent, children }) {
    this.data = data;
    this.parent = parent;
    this.children = children || [];
  }

  setParent(node) {
    this.parent = node;
  }

  add(...nodes) {
    this.children.push(...nodes);
    nodes.forEach((node) => node.setParent(this));
  }

  removeChild(node) {
    this.children = this.children.filter((x) => x !== node);
    node.setParent(undefined);
  }

  isLeaf(node) {
    return !node.children?.length;
  }

  getAllParents(includeSelf = true) {
    const parents = [];
    if (includeSelf) {
      parents.unshift(this);
    }
    let { parent } = this;
    while (parent) {
      parents.unshift(parent);
      parent = parent.parent;
    }
    return parents;
  }

  getAllSiblings() {
    const siblings = this.parent?.children.filter((node) => node !== this) || [];
    return siblings;
  }

  flatten(includeRoot) {
    const nodes = [];
    const traverse = (node) => {
      nodes.push(node);
      node.children.forEach(traverse);
    };
    traverse(this);
    if (!includeRoot) {
      nodes.shift();
    }
    return nodes;
  }

  clone() {
    const cloned = new TreeNode({ data: this.data });
    cloned.add(...this.children);
    return cloned;
  }
}
