import { TreeNodeType } from '../enums';
import { prependTabs, toCRLF, toLF } from '../utils/genUtils';

export interface TypescriptGeneratorConfig extends IGeneratorConfig {
  shouldBreakOutChildObjects: boolean;
}

export default class TypescriptGenerator implements IGenerator {
  public config: TypescriptGeneratorConfig;
  constructor(config?: Partial<TypescriptGeneratorConfig>) {
    // defaults
    const defaultConfig: TypescriptGeneratorConfig = {
      name: 'MyInterface',
      tabString: '  ',
      newlineString: '\n',
      shouldBreakOutChildObjects: false,
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

    let output = `
interface ${this.config.name} ${this.generateObject(input, 0, true)}
    `.trim();

    // format
    output = prependTabs(output, tabs, this.config.tabString);
    output =
      this.config.newlineString === '\r\n' ? toCRLF(output) : toLF(output);
    return output;
  }

  generateNode(node: ITreeNode, tabs: number = 0): string {
    if (node.isValueType) return this.generateValueType(node, tabs);
    else return this.generateObject(node, tabs);
  }

  generateObject(node: ITreeNode, tabs: number = 0, isRootNode = false) {
    if (!node.children) return '';

    const hasFields = node.children && Object.keys(node.children).length > 0;

    let output = this.config.tabString.repeat(tabs);
    if (!isRootNode) {
      output += `${node.name}: `;
    }

    output += '{';

    if (hasFields) {
      output += this.config.newlineString;
    }

    for (let key of Object.keys(node.children)) {
      const fieldNode = node.children[key];
      output += this.generateNode(fieldNode, tabs + 1);
      output += this.config.newlineString;
    }

    if (hasFields) {
      output += this.config.tabString.repeat(tabs);
    }

    output += '}';

    if (node.isArray) output += '[]';

    return output;
  }

  generateValueType(node: ITreeNode, tabs: number = 0) {
    let output = '';

    switch (node.type) {
      case TreeNodeType.String:
        output += `${node.name}: string`;
        break;
      case TreeNodeType.Number:
        output += `${node.name}: number`;
        break;
      case TreeNodeType.Boolean:
        output += `${node.name}: boolean`;
        break;
      case TreeNodeType.Date:
        // TODO: calendar widget or something?
        output += `${node.name}: Date`;
        break;
      case TreeNodeType.Object:
        throw new Error(
          'Attempted to generate a value type with an Object node.'
        );
      default:
        output += `${node.name}: any`;
        break;
    }

    if (node.isArray) output += '[]';

    return prependTabs(output, tabs, this.config.tabString);
  }
}
