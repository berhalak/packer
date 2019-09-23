"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_indicator_default = "$type";
const unpack_hook = 'unpacked';
function pack(type) {
    return function (target) {
        target[type_indicator_default] = type;
    };
}
exports.pack = pack;
class Packer {
    static pack(model, typeSelector = type_indicator_default) {
        if (typeof model != 'object') {
            throw "Packer works only on objects";
        }
        Packer.type_indicator = typeSelector;
        if (model[typeSelector]) {
            // don't pack twice
            return model;
        }
        let js = JSON.parse(JSON.stringify(model));
        Packer.updateTypeInfo(model, js);
        return js;
    }
    static unpack(model, typeSelector = type_indicator_default) {
        if (!model) {
            return null;
        }
        Packer.type_indicator = typeSelector;
        let js = Packer.updatePrototypes(JSON.parse(JSON.stringify(model)));
        return js;
    }
    static serialize(model, typeSelector = type_indicator_default) {
        if (typeof model != 'object') {
            throw "Can't serialize primitive types";
        }
        Packer.type_indicator = typeSelector;
        let js = JSON.parse(JSON.stringify(model));
        Packer.updateTypeInfo(model, js);
        return JSON.stringify(js);
    }
    static deserialize(packed, typeSelector = type_indicator_default) {
        if (!packed) {
            return null;
        }
        Packer.type_indicator = typeSelector;
        let js = Packer.updatePrototypes(JSON.parse(packed));
        return js;
    }
    static register(...constructor) {
        for (const iterator of constructor) {
            Packer.registerSafe(iterator);
        }
    }
    static registerSafe(constructor, warn = false) {
        let c = constructor;
        if (c.knownTypes) {
            for (const type of c.knownTypes()) {
                Packer.registerSafe(type);
            }
        }
        let fullName = constructor[type_indicator_default];
        if (fullName) {
            if (!(fullName in Packer.cache)) {
                Packer.cache[fullName] = constructor.prototype;
            }
            else if (warn) {
                console.warn("Trying to register the same name " + fullName);
            }
            return fullName;
        }
        else {
            let name = constructor.name;
            if (!name) {
                return name;
            }
            if (name in Packer.cache) {
                if (warn) {
                    console.warn("Trying to register the same name " + name);
                }
                return name;
            }
            Packer.cache[constructor.name] = constructor.prototype;
            return constructor.name;
        }
    }
    static updateTypeInfo(aModel, aJs) {
        for (let key of Object.keys(aModel)) {
            let value = aModel[key];
            if (value != null) {
                let primType = typeof (value);
                if (primType == 'object') {
                    let constructor = Reflect.getPrototypeOf(value).constructor;
                    let type = constructor.name;
                    if (type != 'Date') {
                        if (type != 'Array' && type != 'Object') {
                            type = Packer.registerSafe(constructor, false);
                            aJs[key][Packer.type_indicator] = type;
                        }
                        Packer.updateTypeInfo(aModel[key], aJs[key]);
                    }
                    else {
                        aJs[key] = {
                            value: aJs[key],
                            [Packer.type_indicator]: 'Date'
                        };
                    }
                }
                else {
                }
            }
        }
        let constructor = Reflect.getPrototypeOf(aModel).constructor;
        let type = constructor.name;
        if (type != 'Array') {
            aJs[Packer.type_indicator] = Packer.registerSafe(aModel.constructor, false);
        }
    }
    static updatePrototypes(js) {
        for (let key in js) {
            let value = js[key];
            if (value === null || value === undefined)
                continue;
            if (typeof (value) == 'object') {
                let type = value[Packer.type_indicator];
                if (type == 'Date') {
                    js[key] = new Date(value.value);
                }
                else {
                    Packer.updatePrototypes(value);
                }
            }
        }
        if (js.constructor.name != 'Array') {
            let type = js[Packer.type_indicator];
            if (type && type != 'Object') {
                var proto = Packer.cache[type];
                if (!proto) {
                    console.warn("Can't deserialize object " + type + " " + JSON.stringify(js));
                }
                else {
                    Object.setPrototypeOf(js, proto);
                    if (unpack_hook in js && typeof js[unpack_hook] == 'function') {
                        js[unpack_hook]();
                    }
                }
            }
            delete js[Packer.type_indicator];
        }
        return js;
    }
    static unpackSafe(model) {
        if (!model[type_indicator_default])
            return;
        let js = Packer.updatePrototypes(model);
        return js;
    }
}
exports.Packer = Packer;
Packer.cache = {};
Packer.type_indicator = "$type";
//# sourceMappingURL=Packer.js.map