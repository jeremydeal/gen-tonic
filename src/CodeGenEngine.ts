import { TreeNodeType } from './enums';

export class TreeNode implements ITreeNode {
  public type: TreeNodeType;
  public children: ITreeNodeChildren | null;
  public parent?: ITreeNode;

  constructor(
    type: TreeNodeType | ITreeNodeChildren,
    public isArray: boolean = false,
    public name?: string
  ) {
    this.type = typeof type === "object" ? TreeNodeType.Object : type;
    this.children = typeof type === "object" ? type : null;
  }

  get hasChildren(): boolean {
    return !!this.children && Object.keys(this.children).length > 0;
  }

  get isObject(): boolean {
    return this.type === TreeNodeType.Object;
  }

  get isValueType(): boolean {
    return this.type !== TreeNodeType.Object;
  }

  public setParent(parent: ITreeNode) {
    this.parent = parent;
  }

  /**
   * Recursively copies the tree, starting at the given node
   */
  copy(): ITreeNode {
    const copy = new TreeNode(this.type, this.isArray, this.name);
    copy.parent = this.parent;

    if (this.children) {
      copy.children = {};
      for (let key of Object.keys(this.children)) {
        // TODO: um, trim out empty arrays and objects?
        const child = this.children[key];
        copy.children[key] = child.copy();
      }
    }

    return copy;
  }
}

export default class CodeGenEngine {
  constructor(private parser: IParser, private generator: IGenerator) {}

  generate(input: string) {
    const tree = this.parser.parse(input);
    const output = this.generator.generate(tree);
    return output;
  }
}
