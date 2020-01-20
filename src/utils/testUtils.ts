import { TreeNode } from '../CodeGenEngine';
import { TreeNodeType } from '../enums';

export function getValueTypeNode(type: TreeNodeType, name?: string) {
  return new TreeNode(type, false, name || 'test');
}

export function getObjectTypeNode(type: ITreeNodeChildren, name?: string) {
  return new TreeNode(type, false, name);
}

export function diffStrings(stringA: string, stringB: string): any[] {
  const diff = stringA.split('').map((a, i) => {
    const b = stringB[i];
    if (a === b) return a;
    return {
      gen: a,
      test: b,
      i,
    };
  });

  return diff;
}
