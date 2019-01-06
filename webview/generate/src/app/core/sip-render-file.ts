import { IFileItem } from "./base";
import { SipRender } from "./sip-render";
import { JoinPath } from "./lib";


/** file支持render内容的属性，注意顺序 */
const _fileProps = [
    'input', 'prefix',
    'fileName', 'extend', 'path', 'className'
];

function _makeFilePropVar(data: any): void {
    _fileProps.forEach(function (item) {
        data[item] = _getVarIn(data, data[item]);
    });
}

function _getVarIn(data: any, template: string): string {
    if (!template) return template;
    if (!SipRender.hasRender(template)) return template;
    return SipRender.render(template, data, SipRenderFile.helper);
}

let _logs: string[] = [];

export class SipRenderFile {
    /** $helper */
    static helper: any = {};
    /** 扩展 $data */
    static extend: any = {};
    static log(...args: string[]): '' {
        _logs.push(...args);
        return '';
    }

    /** renderFile后返回logs */
    get logs(): string[] {
        return _logs;
    }

    renderFile(file: IFileItem, notConent?: boolean): { fileName: string, content: string, dir: boolean, logs: string[] } {
        _logs = [];

        let data = Object.assign({}, SipRenderFile.extend, file);

        _makeFilePropVar(data);

        let ret = {
            fileName: JoinPath(data.path, data.fileName),
            content: notConent === true ? '' : _getVarIn(data, data.extendContent),
            dir: data.pathType == 'dir',
            logs: _logs
        };

        return ret;
    }

    getFileFullPath(file: IFileItem) {
        let info = this.renderFile(file, true);

        let fileName = info.fileName;
        return info.dir ? fileName : [fileName, file.extend].join('.');
    }



}