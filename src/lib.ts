let stringEmpty = "",
    toString = Object.prototype.toString,
    core_hasOwn = Object.prototype.hasOwnProperty,
    noop = function () { };

function testObject(obj: any) {
    if (obj.constructor &&
        !core_hasOwn.call(obj, "constructor") &&
        !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
        return false;
    }
}

export class Lib {
    static stringEmpty = stringEmpty;

    static noop = noop;

    static hasOwnProp(obj: any, prop: string) {
        return core_hasOwn.call(obj, prop);
    }

    static trace(e: any) {
        console.error && console.error(e.stack || e.message || e + '');
    }

    static isType(typename: string, value: any) {
        //typename:String, Array, Boolean, Object, RegExp, Date, Function,Number //兼容
        //typename:Null, Undefined,Arguments    //IE不兼容
        return toString.apply(value) === '[object ' + typename + ']';
    }

    static isUndefined(obj: any) {
        ///<summary>是否定义</summary>

        return (typeof (obj) === "undefined" || obj === undefined);
    }

    static isNull(obj: any) {
        ///<summary>是否Null</summary>

        return (obj === null || Lib.isUndefined(obj));
    }

    static isBoolean(obj: any) {
        return Lib.isType("Boolean", obj);
    }

    static isNullEmpty(s: any) {
        return (Lib.isNull(s) || s === stringEmpty);
    }

    static isFunction(fun: any) {
        return Lib.isType("Function", fun);
    }

    static isNumeric(n: any) {
        //return cmpx.isType("Number", n) && !isNaN(n) && isFinite(n);;
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    static isString(obj: any) {
        return Lib.isType("String", obj);
    }

    static isObject(obj: any) {
        return obj && Lib.isType("Object", obj);
    }

    static isArray(value: any) {
        return Array.isArray ? Array.isArray(value) : Lib.isType("Array", value);
    }

    static trim(str: string, newline?: boolean) {
        return str ? (newline ? str.replace(/^(?:\s|\u3000|\ue4c6|\n|\r)*|(?:\s|\u3000|\ue4c6|\n|\r)*$/g, '') :
            str.replace(/^(?:\s|\u3000|\ue4c6)*|(?:\s|\u3000|\ue4c6)*$/g, '')) : '';
    }

    static trimEnd(str: string, newline?: boolean) {
        return str ? (newline ? str.replace(/(?:\s|\u3000|\ue4c6|\n|\r)*$/g, '') :
            str.replace(/(?:\s|\u3000|\ue4c6)*$/g, '')) : '';
    }

}

let _tick = 0;