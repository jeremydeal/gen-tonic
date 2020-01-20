import { TreeNodeType } from '../enums';
import { prependTabs, getTrimmedNodes, toCRLF, toLF } from '../utils/genUtils';
import TypescriptGenerator from './TypescriptGenerator';
import EmptyJsObjectGenerator from './EmptyJsObjectGenerator';
import { titleCase } from 'title-case';

export interface FormikGeneratorConfig extends IGeneratorConfig {
  errorMessages: boolean;
  tabString: string;
}

export default class FormikGenerator implements IGenerator {
  public config: FormikGeneratorConfig;
  constructor(config?: Partial<FormikGeneratorConfig>) {
    // defaults
    const defaultConfig: FormikGeneratorConfig = {
      name: 'MyForm',
      tabString: '  ',
      newlineString: '\n',
      errorMessages: true,
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

    const trimCondition = (node: ITreeNode) => {
      // trim empty objects
      if (node.isObject && !node.hasChildren) return true;
      // trim empty arrays
      if (node.isArray && node.type === TreeNodeType.Any) return true;
      return false;
    };
    const trimmedInput = getTrimmedNodes(input, trimCondition);

    const formName = this.config.name;
    const interfaceName = formName + 'Values';

    const typescriptInterface = new TypescriptGenerator({
      name: interfaceName,
    }).generate(trimmedInput);
    const initialValues = new EmptyJsObjectGenerator({
      name: 'initialValues',
      typescriptInterface: interfaceName,
    }).generate(trimmedInput, 1);

    // for sample form, see: https://jaredpalmer.com/formik/docs/guides/typescript
    let output = `
import React from 'react';
import {
  Formik,
  FormikHelpers,
  FormikProps,
  Form,
  Field,
  FieldProps,
  FieldArray,
  ErrorMessage
} from 'formik';

${typescriptInterface}

const ${formName}: React.FC<{}> = () => {
${initialValues}

  return (
    <div>
      <h1>My Example</h1>
      <Formik
        initialValues={initialValues}
        onSubmit={(values, actions) => {
          console.log({ values, actions });
          alert(JSON.stringify(values, null, 2));
          actions.setSubmitting(false);
        }}
      >
        {({ value }) => (
          <Form>
${this.generateNode(trimmedInput, 6)}
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ${formName};
    `.trim();

    // format
    output = prependTabs(output, tabs, this.config.tabString);
    output =
      this.config.newlineString === '\r\n' ? toCRLF(output) : toLF(output);
    return output;
  }

  // TODO: handle recursively adding ancestor names!
  generateNode(node: ITreeNode, tabs: number = 0): string {
    if (!node.children) return '';

    let output = '';

    // TODO: add a header before nodes?
    // output += "\t".repeat(tabs);

    if (node.isValueType && !node.isArray)
      return this.generateValueType(node, tabs);
    if (node.isValueType && node.isArray)
      return this.generateArrayOfValueTypes(node, tabs);
    if (node.isObject && node.isArray)
      return this.generateArrayOfObjects(node, tabs);

    let isFirstField = true;
    for (let key of Object.keys(node.children)) {
      if (!isFirstField) output += this.config.newlineString;
      const fieldNode = node.children[key];
      output += this.generateNode(fieldNode, tabs);
      // TODO: finalize spacing!
      output += this.config.newlineString;
      isFirstField = false;
    }

    return output;
  }

  generateValueType(
    node: ITreeNode,
    tabs: number = 0,
    includeFormatting = true
  ) {
    const name = getNodeName(node);
    let output = '';

    switch (node.type) {
      case TreeNodeType.Number:
        output += renderField(name, 'text');
        break;
      case TreeNodeType.Boolean:
        output += renderField(name, 'checkbox');
        break;
      case TreeNodeType.Date:
        // TODO: calendar widget or something?
        output += renderField(name, 'text');
        break;
      case TreeNodeType.Object:
        throw new Error(
          'Attempted to generate a value type with an Object node.'
        );
      default:
        output += renderField(name, 'text');
        break;
    }

    if (!output) console.log(node);

    return prependTabs(output, tabs, this.config.tabString);

    function renderField(name: string, type: string): string {
      if (includeFormatting)
        return `
<div>
  <label htmlFor="${name}">${getLabelName(name)}</label>
  <Field name="${name}" type="${type}" />
  <ErrorMessage name="${name}" />
</div>
        `.trim();

      return `<Field name="${name}" type="${type}" />`;
    }

    function getLabelName(name: string): string {
      const pieces = name.split(/[\.\[\]]/);
      const last = pieces[pieces.length - 1];
      return titleCase(last.trim());
    }
  }

  generateArrayOfValueTypes(node: ITreeNode, tabs: number = 0): string {
    const name = getNodeName(node);
    const output = renderArray(name /* node */);
    return prependTabs(output, tabs, this.config.tabString);

    // TODO: use type
    // TODO: initialValues on arrayHelpers.insert and arrayHelpers.push
    function renderArray(name: string /*, node: ITreeNode */): string {
      const indexVariableName = getIndexVariableName(/* node */);
      return `
<FieldArray
  name="${name}"
  render={arrayHelpers => (
    <div>
      <h3>${titleCase(name)}</h3>

      {values.${name} && values.${name}.length > 0 ? (
        values.${name}.map((model, ${indexVariableName}) => (
          <div key={${indexVariableName}}>
            <Field name={\`${name}[\${${indexVariableName}}]\`} />

            <button
              type="button"
              onClick={() => arrayHelpers.remove(${indexVariableName})}
            >
              -
            </button>
            <button
              type="button"
              onClick={() => arrayHelpers.insert(${indexVariableName}, '')}
            >
              +
            </button>
          </div>
        ))
      ) : (
        <button type="button" onClick={() => arrayHelpers.push('')}>
          Add
        </button>
      )}
    </div>
  )}
/>
    `.trim();
    }
  }

  generateArrayOfObjects(node: ITreeNode, tabs: number = 0): string {
    if (!node.children) return '';

    const name = getNodeName(node);

    // TODO: initialValues on arrayHelpers.insert and arrayHelpers.push
    const fields = Object.keys(node.children).map(key => node.children![key]);
    const indexVariableName = getIndexVariableName(/* node */);
    const output =
      `
<FieldArray
  name="${name}"
  render={arrayHelpers => (
    <h3>${titleCase(name)}</h3>

    <div>
      {values.${name} && values.${name}.length > 0 ? (
        values.${name}.map((model, ${indexVariableName}) => (
          <div key={${indexVariableName}}>
`.trim() +
      this.config.newlineString +
      fields
        .filter(x => x.type !== TreeNodeType.Object)
        // TODO: add index to the name of the output Fields
        .map(field => this.generateValueType(field, 6, false))
        .join(this.config.newlineString) +
      this.config.newlineString.repeat(2) +
      this.config.tabString.repeat(6) +
      `
            <button
              type="button"
              onClick={() => arrayHelpers.remove(${indexVariableName})}
            >
              -
            </button>
            <button
              type="button"
              onClick={() => arrayHelpers.insert(${indexVariableName}, {})}
            >
              +
            </button>
          </div>
        ))
      ) : (
        <button type="button" onClick={() => arrayHelpers.push({})}>
          Add
        </button>
      )}
    </div>
  )}
/>
    `.trim();

    return prependTabs(output, tabs, this.config.tabString);
  }
}

function getIndexVariableName(/* node: ITreeNode */) {
  // TODO: recursively determine how many arrays deep we are???
  return 'index';
}

function getNodeName(node: ITreeNode): string {
  let output = node.name || '';
  let curNode = node.parent;
  while (curNode) {
    const curNodeName = curNode.name || '';
    if (curNodeName) output = `${curNodeName}.${output}`;
    curNode = curNode.parent;
  }
  return output;
}
