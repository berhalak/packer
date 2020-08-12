"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Packer = exports.PackerLogger = exports.ignore = exports.pack = void 0;
function isObject(model) {
    return model && typeof model == 'object' && !Array.isArray(model);
}
const marker = '$type';
function pack(name) {
    return function (target) {
        if (name) {
            target[marker] = typeof name == 'string' ? name : name.name;
        }
        Packer.register(target);
    };
}
exports.pack = pack;
const IGNORES = '$ignores';
function ignore(target, prop) {
    target = target.constructor;
    target[IGNORES] = target[IGNORES] || {};
    target[IGNORES][prop] = true;
}
exports.ignore = ignore;
const version = "3.0.1";
class PackerLogger {
    static print() {
        console.log("Types registered in Packer:" + version);
        for (let key in registry) {
            console.log(`${key} is registered to:`);
            console.log(registry[key]);
        }
        if (Object.keys(registry).length == 0) {
            console.log("No types registered");
        }
    }
}
exports.PackerLogger = PackerLogger;
PackerLogger.debug = false;
let registry = {};
console.debug(`Packer ${version} started`);
class ModelRegister {
    constructor() {
        this._map = new Map();
        this._unpackMap = new Map();
    }
    getById(model) {
        return this._unpackMap.get(model);
    }
    was(model) {
        return this._unpackMap.has(model);
    }
    remember(model, data) {
        if (model['/#PackerId#/'] !== undefined) {
            this._unpackMap.set(model['/#PackerId#/'], data);
        }
    }
    has(model) {
        return this._map.has(model);
    }
    getId(model) {
        let entry = this._map.get(model);
        entry.packed['/#PackerId#/'] = entry.id;
        return entry.id;
    }
    set(model, packed) {
        this._map.set(model, { id: `/#PackerId:${this._map.size}#/`, packed });
    }
}
class Packer {
    static clone(model) {
        return this.unpack(this.pack(model));
    }
    static clear() {
        registry = {};
    }
    static pack(model) {
        return this._pack(model);
    }
    static _pack(model, stack = null) {
        if (!model) {
            return null;
        }
        // if this is already packed
        if (model[marker]) {
            return model;
        }
        stack = stack !== null && stack !== void 0 ? stack : new ModelRegister();
        const type = this.register(model);
        if (type == 'Date') {
            return {
                id: model.toISOString(),
                [marker]: 'Date'
            };
        }
        if (type == 'Set') {
            return {
                values: [...model.values()].map(x => Packer.pack(x)),
                [marker]: 'Set'
            };
        }
        if (type == 'Map') {
            const dict = {};
            const map = model;
            dict.keys = [...map.keys()].map(x => Packer.pack(x));
            dict.values = [...map.values()].map(x => Packer.pack(x));
            dict[marker] = 'Map';
            return dict;
        }
        const ignores = this.ignores(model);
        let packed = {};
        if (isObject(model)) {
            if (stack.has(model)) {
                return stack.getId(model);
            }
            if (typeof model.pack == 'function') {
                packed = model.pack();
                stack.set(model, packed);
            }
            else if (model.constructor && typeof model.constructor.pack == 'function') {
                packed = model.constructor.pack(model);
                stack.set(model, packed);
            }
            else {
                stack.set(model, packed);
                for (let key in model) {
                    if (key.startsWith('$'))
                        continue;
                    if (key in ignores) {
                        continue;
                    }
                    packed[key] = model[key];
                }
                for (let key in packed) {
                    packed[key] = this._pack(packed[key], stack);
                }
            }
            if (type != Object.name && type)
                packed[marker] = type;
            return packed;
        }
        else if (Array.isArray(model)) {
            packed = model.map(x => this._pack(x, stack));
            return packed;
        }
        else {
            return model;
        }
    }
    static ignores(model) {
        var _a;
        if (!model) {
            return {};
        }
        if (typeof model == 'function') {
            return model.$ignores || {};
        }
        else if (isObject(model)) {
            return (model === null || model === void 0 ? void 0 : model.constructor) ? ((_a = model.constructor[IGNORES]) !== null && _a !== void 0 ? _a : {}) : {};
        }
        return {};
    }
    static register(model) {
        if (!model) {
            return null;
        }
        if (typeof model == 'function') {
            let type = model.name;
            if (model[marker]) {
                type = model[marker];
            }
            if (registry[type] !== model && PackerLogger.debug) {
                console.debug(`[Packer] Registering type ${type}`);
            }
            registry[type] = model;
            return type;
        }
        else if (isObject(model)) {
            return model.constructor ? this.register(model.constructor) : null;
        }
        return null;
    }
    static restore(model, definition) {
        if (Array.isArray(model)) {
            for (let i = 0; i < model.length; i++) {
                definition[i] = this.restore(model[i], definition[i]);
            }
            return definition;
        }
        else if (isObject(definition)) {
            const obj = definition;
            if (typeof obj.unpack == 'function') {
                obj.unpack(model);
                return obj;
            }
            for (let key in obj) {
                let is = obj[key];
                if (is == null || is === undefined) {
                    obj[key] = this.unpack(model[key]);
                }
                else {
                    obj[key] = this.restore(model[key], is);
                }
            }
            return obj;
        }
        else {
            return model;
        }
    }
    static unpack(model, def) {
        return this._unpack(model, def);
    }
    static _unpack(model, def, stack = null) {
        stack = stack !== null && stack !== void 0 ? stack : new ModelRegister();
        if (isObject(model)) {
            let data = def || {};
            const typeName = model[marker];
            if (typeName === undefined) {
                return model;
            }
            if (typeName == 'Object') {
                let data = {};
                stack.remember(model, data);
                for (let key in model) {
                    if (key != marker) {
                        data[key] = this._unpack(model[key], null, stack);
                    }
                }
                return data;
            }
            if (typeName == "Date") {
                const date = new Date(model.id);
                return date;
            }
            else if (typeName == "Set") {
                const set = new Set(model.values.map(x => Packer._unpack(x, null, stack)));
                return set;
            }
            else if (typeName == "Map") {
                const set = new Map();
                for (let i = 0; i < model.keys.length; i++) {
                    set.set(model.keys[i], Packer._unpack(model.values[i], null, stack));
                }
                return set;
            }
            const ctr = registry[typeName];
            if (ctr) {
                if (ctr.unpack) {
                    let obj = ctr.unpack(model);
                    return obj;
                }
                else {
                    stack.remember(model, data);
                    for (let key in model) {
                        if (key != marker) {
                            data[key] = this._unpack(model[key], null, stack);
                        }
                    }
                    Object.setPrototypeOf(data, ctr.prototype);
                    return data;
                }
            }
            else {
                if (PackerLogger.debug) {
                    console.debug(`[Packer] Type ${typeName} is not registered while unpacking:`);
                    console.debug(data);
                }
                throw new Error(`Type ${typeName} is not registered`);
            }
        }
        else if (model && Array.isArray(model)) {
            return model.map(x => this._unpack(x, null, stack));
        }
        if (typeof model == 'string') {
            if (stack.was(model)) {
                return stack.getById(model);
            }
        }
        return model;
    }
    static serialize(model) {
        return JSON.stringify(this.pack(model));
    }
    static deserialize(json) {
        return this.unpack(JSON.parse(json));
    }
}
exports.Packer = Packer;
//# sourceMappingURL=index.js.map