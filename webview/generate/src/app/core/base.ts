
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

/** 插件传过来的参数 */
export interface IVscodeOption {
    curPath?: string;
    curFile?: string;
    isDir?: boolean;
    isLinux?: boolean;
    input?: string;
    tmplName?:string;
    prefix?: string;
    fileName?: string;
    workspaceRoot?: string;
    extensionPath?: string;
    modules: string[];
    generate?: {
        /** 输入内容 */
        input: string;
        /** 模板名称 */
        tmpl: string;
    };
    helper?: string;
}

/** 输入 */
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

/** 模板 */
export interface ITmplItem {
    title: string;
    index?: number;
    active?: boolean;
    files: IFileItem[];
    inputs?:InputItem[];
}

/** 保存模板配置 */
export interface IConfig {
    prefix?: string;
    templates?: ITmplItem[];
}
