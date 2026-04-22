import { arrayToTree } from 'performant-array-to-tree';
import TreeNode from './node';
import Label from './label';

export { Label, TreeNode };

export class LabelTreeNode extends TreeNode {
  getName(locale) {
    return this.data?.getName?.(locale) ?? '';
  }

  isSystemLabel() {
    return this.data?.type === 'system';
  }

  getFullName(locale) {
    const parents = this.getAllParents().slice(1);
    return parents.map((p) => (locale ? p.getName(locale) : (p.data?.title ?? ''))).join(' / ');
  }
}

// 将 arrayToTree 的结果 (treeData) 映射成一棵由 LabelTreeNode 构成的 tree model
const mapToTree = (items, parent) => {
  return items.map((item) => {
    const node = new LabelTreeNode({ data: new Label(item.data || {}), parent });
    const children = mapToTree(item.children || [], node);
    node.add(...children);
    return node;
  });
};

export const initLabelTree = (data) => {
  const treeData = arrayToTree(data || []);
  const root = new LabelTreeNode({ data: {} });
  root.add(...mapToTree(treeData));
  return root;
};

export const createEmptyLabelTree = () => {
  return new LabelTreeNode({ data: {} });
};
