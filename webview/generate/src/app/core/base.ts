
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
