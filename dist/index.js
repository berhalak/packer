"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isObject(model) {
    return model && typeof model == 'object' && !Array.isArray(model);
}
function pack(name) {
    return function (target) {
        target['$type'] = name;
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
class Packer {
    static clone(model) {
        return this._unpack(this.pack(model));
    }
    static pack(model) {
        if (!model) {
            return;
        }
        const type = this.register(model);
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
        var _a, _b;
        if (!model) {
            return {};
        }
        if (typeof model == 'function') {
            return model.$ignores || {};
        }
        else if (isObject(model)) {
            return ((_a = model) === null || _a === void 0 ? void 0 : _a.constructor) ? (_b = model.constructor[IGNORES], (_b !== null && _b !== void 0 ? _b : {})) : {};
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
            this.registry[type] = model;
            return type;
        }
        else if (isObject(model)) {
            return model.constructor ? this.register(model.constructor) : null;
        }
        return null;
    }
    static unpack(model) {
        return this._unpack(JSON.parse(JSON.stringify(model)));
    }
    static _unpack(model) {
        if (isObject(model)) {
            for (let key in model) {
                if (key != '$type') {
                    this._unpack(model[key]);
                }
            }
            const ctr = this.registry[model.$type];
            if (ctr) {
                Object.setPrototypeOf(model, ctr.prototype);
                if (model.unpack) {
                    model.unpack();
                }
            }
        }
        else if (model && Array.isArray(model)) {
            model.forEach(x => this._unpack(x));
        }
        return model;
    }
    static serialize(model) {
        return JSON.stringify(this.pack(model));
    }
    static deserialize(json) {
        return this._unpack(JSON.parse(json));
    }
}
exports.Packer = Packer;
Packer.registry = {};
//# sourceMappingURL=index.js.map