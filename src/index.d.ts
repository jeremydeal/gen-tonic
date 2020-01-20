declare interface Dictionary<T> {
    [key: string]: T
}

declare interface ITreeNodeChildren {
    [key: string]: ITreeNode;
}

// TODO: does this help anyone?
declare interface ITreeNode {
    // TODO: get the enum to work here?
    type: number; // TreeNodeType;
    children: ITreeNodeChildren | null;
    hasChildren: boolean;
    isArray: boolean;
    parent?: ITreeNode;
    name?: string;
    isObject: boolean;
    isValueType: boolean;
    setParent(parent: ITreeNode): void;
    copy(): ITreeNode;
}

declare type IParser = {
    parse(input: string): ITreeNode;
};

declare interface IParserConfig {
    
}

declare type IGenerator = {
    generate(input: ITreeNode, tabs?: number): string;
};

declare interface IGeneratorConfig {
    name: string;
    tabString: string;
    newlineString: string;
}
