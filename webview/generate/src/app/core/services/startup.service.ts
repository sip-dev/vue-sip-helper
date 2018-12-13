import { Injectable } from '@angular/core';
import { VscodeMessageService } from './vscode-message.service';

/**
 * 用于应用启动时
 * 一般用来获取应用所需要的基础数据等
 */
@Injectable()
export class StartupService {
    constructor(private _vsMsg: VscodeMessageService) { }

    load(): Promise<any> {
        
        return new Promise((resolve, reject) => {
            this._vsMsg._startUP(function(){ resolve(); });
        });
    }
}
