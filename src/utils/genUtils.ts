export function prependTabs(
  input: string,
  n: number,
  tabString: string = '  '
) {
  if (!input) return '';

  let output = '';
  const hasReturnCarriage = (input.match(/\r?\n/) || []).length > 0;
  const newlineString = hasReturnCarriage ? '\r\n' : '\n';
  let isFirstLine = true;
  for (let line of input.split(/\r?\n/)) {
    // prepend newline for all but the first line
    if (!isFirstLine) output += newlineString;

    // add tabs
    output += tabString.repeat(n) + line;

    isFirstLine = false;
  }

  return output;
}

export function getTrimmedNodes(
  root: ITreeNode,
  filterCondition: (node: ITreeNode) => boolean
): ITreeNode {
  const copy = root.copy();
  trimNodes(copy);
  return copy;

  function trimNodes(node: ITreeNode) {
    if (node && node.children) {
      // make a copy of children so we can filter it
      const originalChildren = node.children;
      node.children = {};

      for (let key of Object.keys(originalChildren)) {
        const child = originalChildren[key];
        // trim anything that returns true for the "filterCondition" from the node's children
        if (filterCondition(child)) continue;
        // recursively trim
        trimNodes(child);
        node.children[key] = child;
      }
    }
  }
}

export function toLF(s: string) {
  return s.replace(/\r\n/g, '\n');
}

export function toCRLF(s: string) {
  return s.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
}
