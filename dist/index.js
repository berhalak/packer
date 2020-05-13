"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Packer = exports.PackerLogger = exports.ignore = exports.pack = void 0;
function isObject(model) {
    return model && typeof model == 'object' && !Array.isArray(model);
}
function pack(name) {
    return function (target) {
        if (name) {
            target['$type'] = typeof name == 'string' ? name : name.name;
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
const version = "2.0.8";
let PackerLogger = /** @class */ (() => {
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
    PackerLogger.debug = false;
    return PackerLogger;
})();
exports.PackerLogger = PackerLogger;
let registry = {};
console.debug(`Packer ${version} started`);
class Packer {
    static clone(model) {
        return this.unpack(this.pack(model));
    }
    static clear() {
        registry = {};
    }
    static pack(model) {
        if (!model) {
            return null;
        }
        if (model.$type) {
            return model;
        }
        const type = this.register(model);
        if (type == 'Date') {
            return {
                id: model.toISOString(),
                $type: 'Date'
            };
        }
        if (type == 'Set') {
            return {
                values: [...model.values()].map(x => Packer.pack(x)),
                $type: 'Set'
            };
        }
        if (type == 'Map') {
            const dict = {};
            const map = model;
            dict.keys = [...map.keys()].map(x => Packer.pack(x));
            dict.values = [...map.values()].map(x => Packer.pack(x));
            dict['$type'] = 'Map';
            return dict;
        }
        const ignores = this.ignores(model);
        let packed = {};
        if (isObject(model)) {
            if (typeof model.pack == 'function') {
                packed = model.pack();
            }
            else if (model.constructor && typeof model.constructor.pack == 'function') {
                packed = model.constructor.pack(model);
            }
            else {
                for (let key in model) {
                    if (key.startsWith('$'))
                        continue;
                    if (key in ignores) {
                        continue;
                    }
                    packed[key] = model[key];
                }
                for (let key in packed) {
                    packed[key] = this.pack(packed[key]);
                }
            }
            if (type != Object.name && type)
                packed['$type'] = type;
        }
        else if (Array.isArray(model)) {
            packed = model.map(x => this.pack(x));
        }
        else {
            return model;
        }
        return packed;
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
            if (model['$type']) {
                type = model['$type'];
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
        if (isObject(model)) {
            let data = def || {};
            const typeName = model.$type;
            if (typeName === undefined) {
                return model;
            }
            if (typeName == 'Object') {
                return model;
            }
            if (typeName == "Date") {
                const date = new Date(model.id);
                return date;
            }
            else if (typeName == "Set") {
                const set = new Set(model.values.map(x => Packer.unpack(x)));
                return set;
            }
            else if (typeName == "Map") {
                const set = new Map();
                for (let i = 0; i < model.keys.length; i++) {
                    set.set(model.keys[i], model.values[i]);
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
                    for (let key in model) {
                        if (key != '$type') {
                            data[key] = this.unpack(model[key]);
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
            return model.map(x => this.unpack(x));
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