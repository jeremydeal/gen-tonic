import { TreeNodeType } from '../enums';
import { prependTabs, toCRLF, toLF } from '../utils/genUtils';

export interface EmptyJsObjectGeneratorConfig extends IGeneratorConfig {
  typescriptInterface: string;
  shouldSetVariable: boolean;
}

export default class EmptyJsObjectGenerator implements IGenerator {
  public config: EmptyJsObjectGeneratorConfig;
  constructor(config?: Partial<EmptyJsObjectGeneratorConfig>) {
    // defaults
    const defaultConfig: EmptyJsObjectGeneratorConfig = {
      name: 'emptyObject',
      tabString: '  ',
      newlineString: '\n',
      typescriptInterface: '',
      shouldSetVariable: true,
    };

    // merge custom config onto defaults
    this.config = {
      ...defaultConfig,
      ...(config || {}),
    };
  }

  generate(input: ITreeNode, tabs = 0) {
    if (!input) throw Error('No input was provided.');
    if (typeof input !== 'object' || !input.isObject)
      throw Error('The input was not an object.');
    if (Object.keys(input).length === 0)
      throw Error(
        'The input must have fields in order to generate the form fields.'
      );

    let output = '';
    if (this.config.shouldSetVariable) {
      output += `const ${this.config.name}`;
      if (this.config.typescriptInterface) {
        output += `: ${this.config.typescriptInterface}`;
      }
      output += ' = ';
    }
    output += this.generateObject(input, 0, true);
    output += ';';

    // format
    output = prependTabs(output, tabs, this.config.tabString);
    output =
      this.config.newlineString === '\r\n' ? toCRLF(output) : toLF(output);
    return output;
  }

  generateNode(node: ITreeNode, tabs: number = 0): string {
    // all arrays should be rendered as empty arrays, regardless of type
    if (node.isArray) return this.generateArray(node, tabs);
    if (node.isValueType) return this.generateValueType(node, tabs);
    else return this.generateObject(node, tabs);
  }

  generateObject(node: ITreeNode, tabs: number = 0, isRootNode = false) {
    const hasFields = node.children && Object.keys(node.children).length > 0;

    let output = this.config.tabString.repeat(tabs);
    if (!isRootNode) {
      output += `${node.name}: `;
    }

    output += '{';

    if (hasFields) {
      output += this.config.newlineString;
    }

    const children = node.children || {};
    for (let key of Object.keys(children)) {
      const fieldNode = children[key];
      output += this.generateNode(fieldNode, tabs + 1);
      output += this.config.newlineString;
    }

    if (hasFields) {
      output += this.config.tabString.repeat(tabs);
    }

    output += '}';
    if (!isRootNode) {
      output += ',';
    }

    return output;
  }

  generateValueType(node: ITreeNode, tabs: number = 0) {
    let output = '';

    switch (node.type) {
      case TreeNodeType.String:
        output += `${node.name}: "",`;
        break;
      case TreeNodeType.Number:
        output += `${node.name}: 0,`;
        break;
      case TreeNodeType.Boolean:
        output += `${node.name}: false,`;
        break;
      case TreeNodeType.Object:
        throw new Error(
          'Attempted to generate a value type with an Object node.'
        );
      default:
        output += `${node.name}: null,`;
        break;
    }

    return prependTabs(output, tabs, this.config.tabString);
  }

  generateArray(node: ITreeNode, tabs: number = 0) {
    const output = `${node.name}: [],`;
    return prependTabs(output, tabs, this.config.tabString);
  }
}
