function isObject(model: any) {
    return model && typeof model == 'object' && !Array.isArray(model);
}

type NameLike = string | { name: string };

export function pack(name?: NameLike) {
    return function (target: any) {
        if (name) {
            target['$type'] = typeof name == 'string' ? name : name.name;
        }
        Packer.register(target);
    }
}

const IGNORES = '$ignores';

export function ignore(target: any, prop: string) {
    target = target.constructor;
    target[IGNORES] = target[IGNORES] || {};
    target[IGNORES][prop] = true;
}

export type Packed<T> = any;
const version = "2.0.8";
export class PackerLogger {
    static debug = false;
    static print() {
        console.log("Types registered in Packer:" + version)
        for (let key in registry) {
            console.log(`${key} is registered to:`);
            console.log(registry[key]);
        }
        if (Object.keys(registry).length == 0) {
            console.log("No types registered");
        }
    }
}

let registry: any = {};

console.debug(`Packer ${version} started`);

export class Packer {

    static clone<T>(model: T): T {
        return this.unpack(this.pack(model));
    }

    static clear() {
        registry = {};
    }

    static pack(model: any): any {

        if (!model) {
            return null;
        }

        if (model.$type) {
            return model;
        }

        const type = this.register(model);

        if (type == 'Date') {
            return {
                id: (model as Date).toISOString(),
                $type: 'Date'
            }
        }

        if (type == 'Set') {
            return {
                values: [...(model as Set<any>).values()].map(x => Packer.pack(x)),
                $type: 'Set'
            }
        }

        if (type == 'Map') {
            const dict: any = {};
            const map = model as Map<any, any>;

            dict.keys = [...map.keys()].map(x => Packer.pack(x));
            dict.values = [...map.values()].map(x => Packer.pack(x));
            dict['$type'] = 'Map';

            return dict;
        }

        const ignores = this.ignores(model);

        let packed: any = {};

        if (isObject(model)) {
            if (typeof model.pack == 'function') {
                packed = model.pack();
            } else if (model.constructor && typeof model.constructor.pack == 'function') {
                packed = model.constructor.pack(model);
            } else {
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
        } else if (Array.isArray(model)) {
            packed = (model as Array<any>).map(x => this.pack(x));
        } else {
            return model;
        }

        return packed;
    }

    static ignores(model: any): any {
        if (!model) {
            return {};
        }
        if (typeof model == 'function') {
            return model.$ignores || {};
        } else if (isObject(model)) {
            return model?.constructor ? (model.constructor[IGNORES] ?? {}) : {};
        }
        return {};
    }

    static register(model: any): string {
        if (!model) {
            return null;
        }
        if (typeof model == 'function') {
            let type: string = model.name;
            if (model['$type']) {
                type = model['$type'];
            }
            if (registry[type] !== model && PackerLogger.debug) {
                console.debug(`[Packer] Registering type ${type}`);
            }
            registry[type] = model;
            return type;
        } else if (isObject(model)) {
            return model.constructor ? this.register(model.constructor) : null;
        }
        return null;
    }



    static unpack<T>(model: any, def?: T): T {
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
                return date as any;
            } else if (typeName == "Set") {
                const set = new Set(model.values.map(x => Packer.unpack(x)));
                return set as any;
            } else if (typeName == "Map") {
                const set = new Map<any, any>();
                for (let i = 0; i < model.keys.length; i++) {
                    set.set(model.keys[i], model.values[i]);
                }
                return set as any;
            }
            const ctr = registry[typeName];
            if (ctr) {
                if (ctr.prototype.unpack) {
                    let obj = Object.create(ctr.prototype);
                    obj.unpack(model);
                    return obj;
                } else if (ctr.unpack) {
                    let obj = ctr.unpack(model);
                    return obj;
                } else {
                    for (let key in model) {
                        if (key != '$type') {
                            data[key] = this.unpack(model[key]);
                        }
                    }
                    Object.setPrototypeOf(data, ctr.prototype);
                    return data as any;
                }
            } else {
                if (PackerLogger.debug) {
                    console.debug(`[Packer] Type ${typeName} is not registered while unpacking:`);
                    console.debug(data);
                }
                throw new Error(`Type ${typeName} is not registered`);
            }
        } else if (model && Array.isArray(model)) {
            return (model as any[]).map(x => this.unpack(x)) as any;
        }

        return model as T;
    }

    static serialize(model: any): string {
        return JSON.stringify(this.pack(model));
    }

    static deserialize<T>(json: string): T {
        return this.unpack<T>(JSON.parse(json));
    }
}