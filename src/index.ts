function isObject(model: any) {
    return model && typeof model == 'object' && !Array.isArray(model);
}

export function pack(name: string) {
    return function (target: any) {
        target['$type'] = name;
    }
}

const IGNORES = '$ignores';

export function ignore(target: any, prop: string) {
    target = target.constructor;
    target[IGNORES] = target[IGNORES] || {};
    target[IGNORES][prop] = true;
}

export class Packer {

    private static registry: any = {};

    static clone<T>(model: T): T {
        return this._unpack(this.pack(model));
    }

    static pack(model: any): any {
        if (!model) {
            return;
        }

        const type = this.register(model);
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
        return this._unpack(JSON.parse(JSON.stringify(model)));
    }

    private static _unpack<T>(model: any): T {
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

        } else if (model && Array.isArray(model)) {
            (model as any[]).forEach(x => this._unpack(x));
        }

        return model as T;
    }

    static serialize(model: any): string {
        return JSON.stringify(this.pack(model));
    }

    static deserialize<T>(json: string): T {
        return this._unpack<T>(JSON.parse(json));
    }
}