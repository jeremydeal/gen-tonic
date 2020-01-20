import JsonParser from './JsonParser';
import { TreeNodeType } from '../enums';

const target = new JsonParser();

const flatObject = `
{
  "string": "hi",
  "number": 5,
  "numberAsString": "5",
  "boolean": "true",
  "Date": "2014-01-01T23:28:56.782Z"
}
`.trim();

describe('JsonParser.parse input handling', () => {
  it('rejects bad inputs', () => {
    expect(() => target.parse((null as any) as string)).toThrow();
    expect(() => target.parse((undefined as any) as string)).toThrow();
    expect(() => target.parse('')).toThrow();
    expect(() => target.parse('hi')).toThrow();
    expect(() => target.parse('["hey", "buddy"]')).toThrow();
  });

  it('does not reject good inputs', () => {
    expect(() => {
      target.parse(flatObject);
    }).not.toThrow();
  });
});

describe('JsonParser.parse value type parsing', () => {
  it('can parse a flat object', () => {
    const result = target.parse(flatObject);

    expect(result.type).toBe(TreeNodeType.Object);
    expect(Object.keys(result.children!).length).toBe(5);
    expect(result.children!['string']).not.toBeNull();
  });

  it('can parse value type: string', () => {
    const result = target.parse(flatObject).children!['string'];
    expect(result.name).toBe('string');
    expect(result.type).toBe(TreeNodeType.String);
    expect(result.children).toBe(null);
  });

  it('can parse value type: number', () => {
    const result = target.parse(flatObject).children!['number'];
    expect(result.name).toBe('number');
    expect(result.type).toBe(TreeNodeType.Number);
    expect(result.children).toBe(null);
  });

  it('can parse value type: number as a string', () => {
    const result = target.parse(flatObject).children!['numberAsString'];
    expect(result.name).toBe('numberAsString');
    expect(result.type).toBe(TreeNodeType.Number);
    expect(result.children).toBe(null);
  });

  it('can parse value type: boolean', () => {
    const result = target.parse(flatObject).children!['boolean'];
    expect(result.name).toBe('boolean');
    expect(result.type).toBe(TreeNodeType.Boolean);
    expect(result.children).toBe(null);
  });

  it('can parse value type: Date', () => {
    const result = target.parse(flatObject).children!['Date'];
    expect(result.name).toBe('Date');
    expect(result.type).toBe(TreeNodeType.Date);
    expect(result.children).toBe(null);
  });
});

const deepObject = `
{
  "strings": ["hi", "buddy"],
  "object": {
    "string": "hi, kid",
    "number": 42
  },
  "objects": [
    {
      "string": "hi, kid",
      "number": 1
    },
    {
      "string": "hi, kid",
      "number": 2
    }
  ]
}
`.trim();

describe('JsonParser.parse nested object and array parsing', () => {
  it('can parse an array of value types', () => {
    const root = target.parse(deepObject);
    expect(root.type).toBe(TreeNodeType.Object);

    const result = root.children!['strings'];
    expect(result.name).toBe('strings');
    expect(result.type).toBe(TreeNodeType.String);
    expect(result.children).toBeNull();
    expect(result.isArray).toBe(true);
  });

  it('can parse a child object', () => {
    const result = target.parse(deepObject).children!['object'];
    expect(result.name).toBe('object');
    expect(result.type).toBe(TreeNodeType.Object);
    expect(result.children).not.toBeNull();
    expect(result.isArray).toBe(false);

    // validate fields of child object
    expect(result.children!['string'].type).toBe(TreeNodeType.String);
    expect(result.children!['number'].type).toBe(TreeNodeType.Number);
  });

  it('can parse an array of objects', () => {
    const result = target.parse(deepObject).children!['objects'];
    expect(result.name).toBe('objects');
    expect(result.type).toBe(TreeNodeType.Object);
    expect(result.children).not.toBeNull();
    expect(result.isArray).toBe(true);

    // validate fields of child object
    expect(result.children!['string'].type).toBe(TreeNodeType.String);
    expect(result.children!['number'].type).toBe(TreeNodeType.Number);
  });
});
