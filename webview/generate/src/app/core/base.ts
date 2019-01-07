
export interface IFileItem {
    input?: string;
    fileName: string;
    path: string;
    pathType?: 'dir' | 'file';
    type: string;
    className: string;
    typeInfo?: IGenTypeInfo;
    active: boolean;
    importToModue?: string;
    importToRouting?: string;
    tsContent?: string;
    specContent?: string;
    htmlContent?: string;
    styleContent?: string;
    extend?: string;
    extendContent?: string;
}

export interface IGenTypeInfo {
    ts?: boolean;
    html?: boolean;
    style?: boolean;
    styleType?: string;
    spec?: boolean;
    importToModue?: boolean;
    importToRouting?: boolean;
    moduleExport?: boolean;
    moduleImport?: boolean;
    moduleDeclaration?: boolean;
    moduleEntryComponent?: boolean;
    moduleProvider?: boolean;
    extend?: boolean;
}

export interface IGenType {
    [key: string]: IGenTypeInfo;
}


export interface IVscodeOption {
    curPath?: string;
    curFile?: string;
    isDir?: boolean;
    isLinux?: boolean;
    input?: string;
    prefix?: string;
    fileName?: string;
    workspaceRoot?: string;
    extensionPath?: string;
    modules: string[];
    generate?: { input: string; tmpl: string; };
    helper?: string;
}

export interface ITmplItem {
    title: string;
    index?: number;
    active?: boolean;
    files: IFileItem[];
}

export interface IConfig {
    prefix?: string;
    templates?: ITmplItem[];
}


export interface InputItem {
    name: string;
    title?: string;
    defaultValue?: any;
    desc?: string;
    readonly?: boolean;
    /** 数据源， [{value:'', text:''}] */
    source?: any;
    uiType?: 'input' | 'texteare' | 'select' | 'boolean';
}