

interface OutItem {
    type: 'root' | 'text' | 'for' | 'if' | 'else' | 'item';
    content?: string;
    parent?: OutItem;
    elseItem?: OutItem;
    children?: OutItem[];
}

let _chectRegex = /(\$|\`)/g;
function _checkTemplate(template) {
    _chectRegex.lastIndex = 0;
    return template.replace(_chectRegex, '\\$1');
}

let _itemRegex = /\@\{(.*?)\}/mgi;
let _forRegex = /^\s*\bfor\b(.*?)$/i;
let _forEndRegex = /^\s*\/\bfor\b\s*$/i;
let _ifRegex = /^\s*\bif\b(.*?)$/i;
let _elseRegex = /^\s*\belse\b(.*?)$/i;
let _ifEndRegex = /^\s*\/\bif\b\s*$/i;
function _translate(template: string): OutItem {

    let root: OutItem = {
        type: 'root', children: []
    };

    _itemRegex.lastIndex = 0;
    let lastIndex = 0;
    let parent: OutItem = root;
    template.replace(_itemRegex, function (find, content, index) {
        // console.log('template', arguments);

        let beforeText = _checkTemplate(template.substring(lastIndex, index));
        lastIndex = index + find.length;
        parent.children.push({
            type: 'text',
            parent: parent,
            content: beforeText
        });

        if (_forEndRegex.test(content) || _ifEndRegex.test(content)) {
            if (parent.parent) parent = parent.parent;
            return;
        }

        let elseExec = _elseRegex.exec(content);
        if (elseExec) {
            let ifItem = (parent.type == 'if' || parent.type == 'else') ? parent : null;

            if (parent.parent) parent = parent.parent;
            let elseItem: OutItem = {
                type: 'else',
                parent: parent,
                content: elseExec[1],
                children: []
            };
            parent.children.push(elseItem);
            parent = elseItem;

            ifItem && (ifItem.elseItem = elseItem);
            return '';
        }

        let forExec = _forRegex.exec(content);
        if (forExec) {
            let forItem: OutItem = {
                type: 'for',
                parent: parent,
                content: forExec[1],
                children: []
            };
            parent.children.push(forItem);
            parent = forItem;
            return '';
        }
        let ifExec = _ifRegex.exec(content);
        if (ifExec) {
            let ifItem: OutItem = {
                type: 'if',
                parent: parent,
                content: ifExec[1],
                children: []
            };
            parent.children.push(ifItem);
            parent = ifItem;
            return '';
        }
        parent.children.push({
            type: 'item',
            parent: parent,
            content: content
        });

        return '';
    });
    let lastText = _checkTemplate(template.substring(lastIndex));
    parent.children.push({
        type: 'text',
        content: lastText
    });

    return root;
}

function _makeComileString(outs: string[]): string {
    return ['[', outs.join(','), '].join("")'].join('');
}

function _compileChildren(parent: OutItem, children: OutItem[], outs: string[]) {
    children && children.forEach(function (item) {
        _compileItem(item, outs);
    });
}

function _makeIfItem(item: OutItem): string {
    let outs = [];
    _compileChildren(item, item.children, outs);
    let ifStr = _makeComileString(outs);
    let elseStr = '``';
    if (item.elseItem) {
        elseStr = _makeElseItem(item.elseItem);
    }
    return ['(', item.content, ') ? (', ifStr, ') : (', elseStr, ')'].join('');
}

function _makeElseItem(item: OutItem): string {

    let outs = [];
    _compileChildren(item, item.children, outs);
    let ifStr = _makeComileString(outs);

    let content = item.content.trim();
    if (!content) {
        return ifStr;
    }

    let elseStr = '""';
    if (item.elseItem) {
        elseStr = _makeElseItem(item.elseItem);
    }
    return ['(', content, ') ? (', ifStr, ') : (', elseStr, ')'].join('');
}

let _makeForItemRegex = /^\s*(\S+)\s+in\s+(\S+)\s*$/i;
function _makeForItem(item: OutItem): string {
    let content = _makeForItemRegex.exec(item.content);
    if (!content) return '""';

    let outs = [];
    _compileChildren(item, item.children, outs);
    let str = _makeComileString(outs);

    let itemName = content[1];
    let listName = content[2];

    let forContent = `(function () {
    if (!${listName} || ${listName}.length == 0) return '';
    var _s_i_for_outs_ = [];
    for (var i = 0, len = ${listName}.length; i < len; i++) {
        var ${itemName}_index = i, ${itemName} = ${listName}[i];
        _s_i_for_outs_.push(${str});
    }
    return _s_i_for_outs_.join('');
})()`;
    return forContent;
}

function _compileItem(item: OutItem, outs: string[]) {
    switch (item.type) {
        case 'root':
            _compileChildren(item, item.children, outs);
            break;
        case 'text':
            outs.push(['`', item.content, '`'].join(''));
            break;
        case 'item':
            outs.push([item.content].join(''));
            break;
        case 'if':
            outs.push(_makeIfItem(item));
            break;
        case 'for':
            outs.push(_makeForItem(item));
            break;
    }
    item.parent = null;//断开连接
}

type Buildtor = (data) => string;

function _compile(template: string): Buildtor {
    let outs: string[] = [];
    let root: OutItem = _translate(template);
    _compileItem(root, outs);
    let fn
    try {
        fn = new Function('_s_i_data_190104', `var _s_i_mainFn_190104 = function(_s_i_data_190104){
            with(_s_i_data_190104){
                return ${_makeComileString(outs)};
            }
        }
        try{
            return _s_i_mainFn_190104(_s_i_data_190104);
        } catch(e){
            return '';
        }`);

    } catch (e) {
        fn = function () { return '' };
    }
    return fn as any;
}

export const SipRender = {
    compile(template: string): Buildtor {
        let cache = _getCache(template);
        if (cache) {
            return cache.buildtor;
        }
        let buildtor = _compile(template);
        _setCache(template, buildtor);
        return buildtor;
    },
    render(template: string, data: any): string {
        let buildtor = SipRender.compile(template);
        return buildtor(data);
    }
}

interface CacheItem {
    time: number;
    template: string;
    buildtor: Buildtor;
}

let _cacheMax = 200;
let _caches: CacheItem[] = [];

function _setCache(template: string, buildtor: Buildtor) {
    _caches.push({
        time: new Date().valueOf(),
        template: template,
        buildtor: buildtor
    });
    if (_caches.length > _cacheMax) {
        _caches.sort(function (item1, item2) { return item1.time == item2.time ? 0 : (item1.time < item2.time ? 1 : -1) });
        _caches.splice(-20);
        // _caches = _caches.slice(20);
    }
}

function _getCache(template: string): CacheItem {
    let cache = _caches.find(function (item) { return item.template == template });
    if (cache)
        cache.time = new Date().valueOf();
    return cache;
}
