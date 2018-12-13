import * as fs from 'fs';
import * as path from 'path';
import { CalcImportPath, ContentBase, GenerateParam, MakeClassName, PushToExport, PushToImport, PushToModuleDeclarations, PushToModuleEntryComponents, PushToModuleExports, PushToModuleImports, PushToModuleProviders, PushToModuleRouting, RemoveFromExport, RemoveFromImport, RemoveFromModuleDeclarations, RemoveFromModuleExports, RemoveFromModuleImports, RemoveFromModuleProviders, RemoveFromModuleRouting, RemoveModuleEntryComponents } from "./content-base";


export class SipRegModule implements ContentBase {


    generate(params: GenerateParam): string {
        let fsFile = params.path;
        fsFile = fsFile.replace(/\.spec\.ts$/i, '.ts');
        if (!fs.existsSync(fsFile)) return;

        let fInfo = path.parse(path.parse(fsFile).name);

        let name = fInfo.name;
        let prefix = fInfo.ext;
        prefix = prefix ? prefix.substr(1) : prefix;

        if (params.module || params.routing) {
            this.pushToModule(fsFile, params.moduleFile, name, prefix, params);
            this.generate({
                path: params.moduleFile,
                moduleFile: fsFile,
                name: path.basename(params.moduleFile).split('.')[0],
                rootPath: params.rootPath,
                cleanmodule: true
            })
        }

        if (params.cleanmodule || params.cleanrouting)
            this.removeFromModule(fsFile, params.moduleFile, name, prefix);

    }

    pushToModule(fsFile: string, moduleFile: string, name: string, prefix: string, params: GenerateParam) {
        if (!moduleFile) return;
        if (!fs.existsSync(moduleFile)) return;

        let importPath = CalcImportPath(moduleFile, fsFile);

        let className = MakeClassName(name, prefix);

        let content: string = fs.readFileSync(moduleFile, 'utf-8');
        let contentBak = content;

        let isComponent = false;
        if (isComponent = /component|directive|pipe/i.test(prefix)) {

            if (params.module || params.routing) {
                content = PushToImport(content, className, importPath);
            }

            if (params.module) {
                if (params.export)
                    content = PushToExport(content, className, importPath);
                content = PushToModuleDeclarations(content, className);
                content = PushToModuleExports(content, className);

                //将SipModal加入到module.entryComponents
                if (isComponent) {
                    let cpContent = fs.readFileSync(fsFile.replace(/\.[^\.]+$/, '.ts'), 'utf-8')
                    if (/\s+extends\s+SipModal\s+/.test(cpContent))
                        content = PushToModuleEntryComponents(content, className);
                }
            }

            if (params.routing) {
                content = PushToModuleRouting(content, name, className, importPath, false);
            }

        } else if (/service|guard/i.test(prefix)) {

            if (params.module) {

                content = PushToImport(content, className, importPath);
                if (params.export)
                    content = PushToExport(content, className, importPath);
                content = PushToModuleProviders(content, className);

            }

        } else if (/module/i.test(prefix)) {

            let isRouting = /\-routing/i.test(fsFile);

            if (params.module) {
                // if (isRouting) {
                //     content = PushToModuleRouting(content, name, className, importPath, true);
                // } else {
                    content = PushToImport(content, className, importPath);
                    content = PushToModuleImports(content, className);
                    // content = PushToExport(content, className, importPath);
                    content = PushToModuleExports(content, className);
                // }
            }

            if (params.routing) {
                // let isModuleSame = (moduleFile.replace('-routing', '') == fsFile);

                // if (isRouting)
                    content = PushToModuleRouting(content, name, className, importPath, true);
                // else {
                //     content = PushToImport(content, className, importPath);
                //     content = PushToModuleImports(content, className);
                // }
            }


        } else {
            if (params.module && params.export) {
                content = PushToExport(content, className, importPath);
            }
        }

        if (contentBak != content)
            fs.writeFileSync(moduleFile, content, 'utf-8');

    }

    removeFromModule(fsFile: string, moduleFile: string, name: string, prefix: string) {
        if (!moduleFile) return;
        if (!fs.existsSync(moduleFile)) return;
        let importPath = CalcImportPath(moduleFile, fsFile);

        let className = MakeClassName(name, prefix);

        let content: string = fs.readFileSync(moduleFile, 'utf-8');

        let isModule = /module/i.test(prefix);

        let retContent = content;

        retContent = RemoveFromImport(retContent, className);
        retContent = RemoveFromExport(retContent, className, importPath);
        retContent = RemoveFromModuleDeclarations(retContent, className);
        retContent = RemoveFromModuleExports(retContent, className);
        retContent = RemoveFromModuleImports(retContent, className);
        retContent = RemoveFromModuleProviders(retContent, className);
        retContent = RemoveModuleEntryComponents(retContent, className);
        retContent = RemoveFromModuleRouting(retContent, name, className, importPath, isModule);

        if (retContent != content)
            fs.writeFileSync(moduleFile, retContent, 'utf-8');

    }

}