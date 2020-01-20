import TypescriptGenerator from './TypescriptGenerator';
import JsonParser from '../parsers/JsonParser';
import { TreeNodeType } from '../enums';
import { getObjectTypeNode, getValueTypeNode } from '../utils/testUtils';

const target = new TypescriptGenerator();
const jsonParser = new JsonParser();

const flatObject = jsonParser.parse(
  `
{
  "string": "hi",
  "number": 5,
  "numberAsString": "5",
  "boolean": "true",
  "Date": "2014-01-01T23:28:56.782Z"
}
`.trim()
);

describe('TypescriptGenerator.generate', () => {
  it('rejects bad inputs', () => {
    expect(() => target.generate((null as any) as ITreeNode)).toThrow();
    expect(() => target.generate((undefined as any) as ITreeNode)).toThrow();
    expect(() => target.generate(1 as any)).toThrow();
    expect(() => target.generate('hi' as any)).toThrow();
    expect(() => target.generate(true as any)).toThrow();
  });

  it('does not reject good inputs', () => {
    expect(() => {
      target.generate(
        getObjectTypeNode({
          hi: getValueTypeNode(TreeNodeType.Boolean, 'hi'),
        })
      );
    }).not.toThrow();
  });
});

describe('TypescriptGenerator.generate generating a flat object with value types', () => {
  it('can generate a flat object', () => {
    const result = new TypescriptGenerator({ name: 'TestInterface' }).generate(
      flatObject
    );
    expect(result).not.toBeNull();
    expect(result).not.toBe('');
    expect(result).toBe(
      `
interface TestInterface {
  string: string
  number: number
  numberAsString: number
  boolean: boolean
  Date: Date
}
`.trim()
    );
  });
});

const deepObject = jsonParser.parse(
  `
{
  "string": "hi!",
  "strings": ["hi", "buddy"],
  "object": {
    "string": "hi, kid",
    "number": 42
  },
  "objects": [
    {
      "string": "hi, kid",
      "numbers": [1, 2, 3]
    },
    {
      "string": "hi, kid",
      "number": [1, 2, 3]
    }
  ]
}
`.trim()
);

describe('TypescriptGenerator.generate generating a deeply nested object', () => {
  it('can generate a deep object', () => {
    const result = target.generate(deepObject);
    expect(result).not.toBeNull();
    expect(result).not.toBe('');
    expect(result).toBe(
      `
interface MyInterface {
  string: string
  strings: string[]
  object: {
    string: string
    number: number
  }
  objects: {
    string: string
    numbers: number[]
  }[]
} 
`.trim()
    );
  });
});

describe('TypescriptGenerator.generate generating objects with blank values', () => {
  it('can cast a null value to a string field', () => {
    const input = jsonParser.parse(
      `
{
  "string": null
}
      `.trim()
    );

    const result = target.generate(input);
    expect(result).not.toBeNull();
    expect(result).toBe(
      `
interface MyInterface {
  string: any
} 
      `.trim()
    );
  });

  it('can leave an empty array out of the output', () => {
    const input = jsonParser.parse(
      `
  {
    "blankArray": []
  }
      `.trim()
    );
    const result = target.generate(input);
    expect(result).not.toBeNull();
    expect(result).toBe(
      `
interface MyInterface {
  blankArray: any[]
} 
      `.trim()
    );
  });

  it('can leave an empty object out of the output', () => {
    const input = jsonParser.parse(
      `
  {
    "blankObject": {}
  }
      `.trim()
    );
    const result = target.generate(input);
    expect(result).not.toBeNull();
    expect(result).toBe(
      `
interface MyInterface {
  blankObject: {}
}
      `.trim()
    );
  });
});
