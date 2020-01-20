import { TreeNode } from '../CodeGenEngine';
import { TreeNodeType } from '../enums';

export interface JsonParserConfig extends IParserConfig {}

export default class JsonParser implements IParser {
  public config: JsonParserConfig;
  constructor(config?: Partial<JsonParserConfig>) {
    // defaults
    const defaultConfig: JsonParserConfig = {};

    // merge custom config onto defaults
    this.config = {
      ...defaultConfig,
      ...(config || {}),
    };
  }

  parse(input: string): ITreeNode {
    if (!input) throw Error('No input was provided.');

    const object = JSON.parse(input);

    // error: this parser can only handle JSON that parses to a Javascript object
    if (typeof object !== 'object' || Array.isArray(object))
      throw Error(
        'The JSON input must be an object, not an array or value type.'
      );

    const output = this.parseObject(object);
    // console.log(output);
    return output;
  }

  parseObject(object: Dictionary<any>, name?: string): ITreeNode {
    const children: ITreeNodeChildren = {};

    for (let propertyName of Object.keys(object)) {
      const propertyValue = object[propertyName];

      try {
        if (propertyValue === null || propertyValue === undefined)
          children[propertyName] = this.parseValueType(
            propertyValue,
            propertyName
          );
        else if (Array.isArray(propertyValue))
          children[propertyName] = this.parseArray(propertyValue, propertyName);
        else if (typeof propertyValue === 'object')
          children[propertyName] = this.parseObject(
            propertyValue,
            propertyName
          );
        else
          children[propertyName] = this.parseValueType(
            propertyValue,
            propertyName
          );
      } catch (e) {
        console.log('HELP!');
        console.log(object);
        console.log(e.stack);
      }
    }

    // create object's node
    const node = new TreeNode(children, false, name);

    for (let key of Object.keys(children)) {
      children[key].setParent(node);
    }

    return node;
  }

  parseArray(input: any[], name: string): ITreeNode {
    // default to string if no input
    const type =
      input.length === 0 ? TreeNodeType.Any : this.getNodeType(input[0]);

    // handle array of objects
    if (type === TreeNodeType.Object) {
      const object = this.parseObject(input[0], name);
      object.isArray = true;
      return object;
    }

    // handle array of value types
    return new TreeNode(type, true, name);
  }

  parseValueType(input: any, name: string): ITreeNode {
    const type = this.getNodeType(input);
    return new TreeNode(type, false, name);
  }

  getNodeType(input: any): TreeNodeType {
    // nulls -> any
    if (input === null || input === undefined) return TreeNodeType.Any;

    // boolean
    if (
      input === true ||
      input === false ||
      input === 'true' ||
      input === 'false'
    )
      return TreeNodeType.Boolean;

    // empty string to string!
    if (input === '') return TreeNodeType.String;

    // number
    if (!isNaN(input)) return TreeNodeType.Number;

    // Date
    const asTicks = Date.parse(input);
    const asDate = isNaN(asTicks) ? null : new Date(asTicks);
    if (asDate) return TreeNodeType.Date;

    if (typeof input === 'object') return TreeNodeType.Object;

    // default: string
    return TreeNodeType.String;
  }
}
