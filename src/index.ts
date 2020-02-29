function isObject(model: any) {
    return model && typeof model == 'object' && !Array.isArray(model);
}

export function pack(name?: string) {
    return function (target: any) {
        if (name) {
            target['$type'] = name;
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

export class Packer {

    private static registry: any = {};

    static clone<T>(model: T): T {
        return this.unpack(this.pack(model));
    }

    static pack(model: any): any {

        if (!model) {
            return null;
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
            return {
                values: [...(model as Map<any, any>).entries()].map(x => [Packer.pack(x[0]), Packer.pack(x[1])]),
                $type: 'Map'
            }
        }

        const ignores = this.ignores(model);

        let packed: any = {};

        if (isObject(model)) {
            if (typeof model.pack == 'function') {
                packed = model.pack();
            } else {
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
            this.registry[type] = model;
            return type;
        } else if (isObject(model)) {
            return model.constructor ? this.register(model.constructor) : null;
        }
        return null;
    }



    static unpack<T>(model: any): T {
        if (isObject(model)) {
            let data = {};
            const typeName = model.$type;
            if (typeName == "Date") {
                const date = new Date(model.id);
                return date as any;
            } else if (typeName == "Set") {
                const set = new Set(model.values.map(x => Packer.unpack(x)));
                return set as any;
            } else if (typeName == "Map") {
                const set = new Map<any, any>(model.values.map(x => [Packer.unpack(x[0]), Packer.unpack(x[1])]));
                return set as any;
            } else {
                for (let key in model) {
                    if (key != '$type') {
                        data[key] = this.unpack(model[key]);
                    }
                }
            }
            const ctr = this.registry[typeName];
            if (ctr) {
                if (ctr.prototype.unpack) {
                    let obj = Object.create(ctr.prototype);
                    obj.unpack(data);
                    return obj;
                } else if (ctr.unpack) {
                    let obj = ctr.unpack(data);
                    return obj;
                } else {
                    Object.setPrototypeOf(data, ctr.prototype);
                    return data as any;
                }
            }
            return data as any;
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