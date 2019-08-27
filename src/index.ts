const type_indicator_default = "$type";
const unpack_hook = 'unpacked';

export class Packer {

    private static cache: any = {}
    private static type_indicator = "$type";

    public static pack(model: any, typeSelector: string = type_indicator_default): any {
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


    public static unpack<T>(model: object, typeSelector: string = type_indicator_default): T {
        Packer.type_indicator = typeSelector;
        let js = Packer.updatePrototypes(model);
        return <T>js;
    }


    public static serialize(model: any, typeSelector: string = type_indicator_default): string {
        if (typeof model != 'object') {
            throw "Can't serialize primitive types";
        }
        Packer.type_indicator = typeSelector;
        let js = JSON.parse(JSON.stringify(model));
        Packer.updateTypeInfo(model, js);
        return JSON.stringify(js);
    }

    public static deserialize<T>(packed: string, typeSelector: string = type_indicator_default): T {
        Packer.type_indicator = typeSelector;
        let js = Packer.updatePrototypes(JSON.parse(packed));
        return <T>js;
    }


    public static register(...constructor: any[]) {
        for (const iterator of constructor) {
            Packer.registerSafe(iterator);
        }
    }

    public static registerSafe<T>(constructor: new (...args: any[]) => T, warn: boolean = false): string {

        let c = <any>constructor;
        if (c.knownTypes) {
            for (const type of c.knownTypes()) {
                Packer.registerSafe(type);
            }
        }

        let fullName = (<any>constructor).fullName;
        if (fullName) {
            if (!(fullName in Packer.cache)) {
                Packer.cache[fullName] = constructor.prototype;
            } else if (warn) {
                console.warn("Trying to register the same name " + fullName);
            }
            return fullName;
        } else {
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




    private static updateTypeInfo(aModel: any, aJs: any) {
        for (let key of Object.keys(aModel)) {
            let value = aModel[key];
            if (value != null) {
                let primType = typeof (value);
                if (primType == 'object') {
                    let constructor = Reflect.getPrototypeOf(value).constructor;
                    let type = constructor.name;
                    if (type != 'Date') {
                        if (type != 'Array' && type != 'Object') {
                            type = Packer.registerSafe(<any>constructor, false);
                            aJs[key][Packer.type_indicator] = type;
                        }
                        Packer.updateTypeInfo(aModel[key], aJs[key]);
                    } else {
                        aJs[key] = {
                            value: aJs[key],
                            [Packer.type_indicator]: 'Date'
                        }
                    }
                } else {

                }
            }
        }

        let constructor = Reflect.getPrototypeOf(aModel).constructor;
        let type = constructor.name;
        if (type != 'Array') {
            (<any>aJs)[Packer.type_indicator] = Packer.registerSafe(aModel.constructor, false);
        }
    }


    private static updatePrototypes(js: any) {
        for (let key in js) {
            let value = js[key];
            if (value === null || value === undefined)
                continue;
            if (typeof (value) == 'object') {
                let type = value[Packer.type_indicator];
                if (type == 'Date') {
                    js[key] = new Date(value.value);
                } else {
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
                } else {
                    Object.setPrototypeOf(js, proto);
                    if (unpack_hook in js && typeof js[unpack_hook] == 'function') {
                        js[unpack_hook]();
                    }
                    delete js[Packer.type_indicator];
                }
            }
        }
        return js;
    }


    public static unpackSafe<T>(model: any): any {
        if (!model[type_indicator_default])
            return;
        let js = Packer.updatePrototypes(model);
        return <T>js;
    }
}