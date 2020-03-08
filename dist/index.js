"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
class PackerLogger {
    static print() {
        console.log("Types registered in Packer:" + PackerLogger.version);
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
PackerLogger.version = "2.0.7";
const registry = {};
class Packer {
    static clone(model) {
        return this.unpack(this.pack(model));
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
            return {
                values: [...model.entries()].map(x => [Packer.pack(x[0]), Packer.pack(x[1])]),
                $type: 'Map'
            };
        }
        const ignores = this.ignores(model);
        let packed = {};
        if (isObject(model)) {
            if (typeof model.pack == 'function') {
                packed = model.pack();
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
            }
            for (let key in packed) {
                packed[key] = this.pack(packed[key]);
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
    static unpack(model) {
        if (isObject(model)) {
            let data = {};
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
                const set = new Map(model.values.map(x => [Packer.unpack(x[0]), Packer.unpack(x[1])]));
                return set;
            }
            else {
                for (let key in model) {
                    if (key != '$type') {
                        data[key] = this.unpack(model[key]);
                    }
                }
            }
            const ctr = registry[typeName];
            if (ctr) {
                if (ctr.prototype.unpack) {
                    let obj = Object.create(ctr.prototype);
                    obj.unpack(data);
                    return obj;
                }
                else if (ctr.unpack) {
                    let obj = ctr.unpack(data);
                    return obj;
                }
                else {
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
            return data;
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