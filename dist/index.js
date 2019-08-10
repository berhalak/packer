"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Packer {
    static fillNames(aModel, aJs) {
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
                            aJs[key][Packer.currentType] = type;
                        }
                        Packer.fillNames(aModel[key], aJs[key]);
                    }
                    else {
                        aJs[key] = {
                            value: aJs[key],
                            [Packer.currentType]: 'Date'
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
            aJs[Packer.currentType] = Packer.registerSafe(aModel.constructor, false);
        }
    }
    static fillProtos(js) {
        for (let key in js) {
            let value = js[key];
            if (value === null || value === undefined)
                continue;
            if (typeof (value) == 'object') {
                let type = value[Packer.currentType];
                if (type == 'Date') {
                    js[key] = new Date(value.value);
                }
                else {
                    Packer.fillProtos(value);
                }
            }
        }
        if (js.constructor.name != 'Array') {
            let type = js[Packer.currentType];
            if (type && type != 'Object') {
                var proto = Packer.map[type];
                if (!proto) {
                    console.warn("Can't deserialize object " + type + " " + JSON.stringify(js));
                }
                else {
                    Object.setPrototypeOf(js, proto);
                    if (Packer.onDeserializeHandler in js) {
                        js[Packer.onDeserializeHandler]();
                    }
                    delete js[Packer.currentType];
                }
            }
        }
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
        let fullName = constructor.fullName;
        if (fullName) {
            if (!(fullName in Packer.map)) {
                Packer.map[fullName] = constructor.prototype;
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
            if (name in Packer.map) {
                if (warn) {
                    console.warn("Trying to register the same name " + name);
                }
                return name;
            }
            Packer.map[constructor.name] = constructor.prototype;
            return constructor.name;
        }
    }
    static serialize(model, typeSelector = Packer.defaultTypeSelector) {
        if (typeof model != 'object') {
            throw "Can't serialize primitive types";
        }
        Packer.currentType = typeSelector;
        let js = JSON.parse(JSON.stringify(model));
        Packer.fillNames(model, js);
        return JSON.stringify(js);
    }
    static pack(model, typeSelector = Packer.defaultTypeSelector) {
        if (typeof model != 'object') {
            throw "Can't serialize primitive types";
        }
        Packer.currentType = typeSelector;
        let js = JSON.parse(JSON.stringify(model));
        Packer.fillNames(model, js);
        return js;
    }
    static deserialize(packed, typeSelector = Packer.defaultTypeSelector) {
        Packer.currentType = typeSelector;
        let js = Packer.fillProtos(JSON.parse(packed));
        return js;
    }
    static unpack(model, typeSelector = Packer.defaultTypeSelector) {
        Packer.currentType = typeSelector;
        let js = Packer.fillProtos(model);
        return js;
    }
    static unpackSafe(model) {
        if (!model[Packer.defaultTypeSelector])
            return;
        let js = Packer.fillProtos(model);
        return js;
    }
}
Packer.map = {};
Packer.defaultTypeSelector = "$type";
Packer.currentType = "$type";
Packer.onDeserializeHandler = 'onDeserialize';
exports.Packer = Packer;
//# sourceMappingURL=index.js.map