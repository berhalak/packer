export interface MemoPort {
    save(ref: string, model: any): Promise<void>;
    load(ref: string): Promise<any>;
    id(): string;
}

export class InMemory implements MemoPort {
    public db: any = {}
    private _id = 0;
    save(ref: string, obj: any): Promise<void> {
        this.db[ref] = obj;
        return Promise.resolve();
    }
    load(ref: string): Promise<any> {
        return Promise.resolve(this.db[ref]);
    }
    all(path: string): Promise<any[]> {
        let result = [];
        for (let key in this.db) {
            if (key.startsWith(path)) {
                let id = key.replace(path, "");
                if (!id.includes("/")) {
                    result.push(this.db[key]);
                }
            }
        }
        return Promise.resolve(result);
    }

    find(path: string, filter: string): Promise<any[]> {
        return this.all(path);
    }

    id() {
        this._id++;
        return this._id.toString();
    }
}

const s_parent = Symbol.for("$parent");
const s_ref = Symbol.for("$ref");
const s_id = Symbol.for("$id");

export class Memo {
    private static port: MemoPort = new InMemory();
    public static use(port: MemoPort) {
        Memo.port = port;
    }
    public static id(any: any): string {
        if (typeof any == 'string') {
            return any;
        }
        let id = null;
        if (!any) {
            throw new Error();
        }
        if (any.id && typeof any.id == 'function') {
            id = any.id();
        }
        else if (any.id) {
            id = any.id;
        }
        else if (any[s_id]) {
            id = any[s_id];
        }

        if (!id) {
            id = Memo.port.id();
            Memo.setId(id, any);
        }

        return id;
    }

    public static self(any: any): string {
        return Memo.parent(any) + "/" + Memo.type(any) + "/" + Memo.id(any);
    }

    public static ref(any: any): string {
        if (typeof any.ref == 'function') {
            return any.ref();
        }
        if (any[s_ref]) {
            return any[s_ref];
        }
        const ref = Memo.self(any);
        Memo.setRef(ref, any);
        return ref;

    }
    public static type(any: any): string {
        if (typeof any.type == 'function') {
            return any.type();
        }
        let type: string = '';
        if (any.constructor) {
            if (any.constructor['$type']) {
                type = any.constructor['$type'];
            }
            else {
                type = any.constructor.name;
            }
        }
        else {
            type = any['$type'];
        }
        if (!type) {
            return "Object";
        }
        let parts = type.split("#");
        return parts[0];
    }

    public static attach<T>(parent: any, child: T): T {
        if (child && typeof (child as any).parent == 'function') {
            return child;
        }
        if ((child as any)[s_parent]) {
            return child;
        }
        Object.defineProperty(child, s_parent, {
            value: typeof parent == 'string' ? parent : Memo.ref(parent),
            configurable: false,
            enumerable: false,
            writable: false
        })
        return child;
    }

    public static parent(any: any): string {
        if (typeof any.parent == 'function') {
            return any.parent();
        }
        if (any[s_parent]) {
            return any[s_parent];
        }
        return "";
    }
    public static print(any: any) {
        console.log("Id: " + Memo.id(any));
        console.log("Type: " + Memo.type(any));
        console.log("Parent ref: " + Memo.parent(any));
        console.log("Ref: " + Memo.ref(any));
    }

    public static current: Memo = new Memo();

    public static snap(obj: any): Promise<string> {
        return Memo.current.snap(obj);
    }

    public static load(ref: string): Promise<any> {
        let loaded = Memo.current.load(ref);

        return loaded;
    }

    private parentRef: string | undefined;
    private defaultType: string | undefined;

    constructor()
    constructor(obj: any, type?: string)
    constructor(ref: string, type?: string)
    constructor(arg?: any, type?: string) {
        if (arg) {
            if (typeof arg == 'string') {
                this.parentRef = arg;
            } else {
                this.parentRef = Memo.ref(arg);
            }
            this.defaultType = type;
        }
    }

    static setRef(ref: string, obj: any) {
        if (obj.ref && typeof obj.ref == 'function') {
            return;
        }
        if ((obj as any)[s_ref]) {
            return;
        }
        Object.defineProperty(obj, s_ref, {
            value: ref,
            configurable: false,
            enumerable: false,
            writable: false
        })
    }

    static setId(ref: string, obj: any) {
        if (obj.id && typeof obj.id == 'function') {
            return;
        }
        if ((obj as any)[s_id]) {
            return;
        }
        if (obj.id) {
            return;
        }
        Object.defineProperty(obj, s_id, {
            value: ref,
            configurable: false,
            enumerable: false,
            writable: false
        })
    }

    public static async look(parent: any, ctr: { name: string }, id: string): Promise<any> {
        return null;
    }

    public async load(refId: string): Promise<any> {
        let loaded = null;
        let ref = '';
        if (this.parentRef !== undefined) {
            if (!refId.includes("/")) {
                // it has only id
                ref = this.parentRef + "/" + (this.defaultType || "Object") + "/" + refId;

                loaded = await Memo.port.load(ref);
            } else {
                ref = this.parentRef + "/" + refId;
                loaded = await Memo.port.load(ref);
            }
        } else {
            if (!refId.startsWith("/")) {
                ref = "/Object/" + refId;
                loaded = await Memo.port.load(ref);
            } else {
                ref = refId;
                loaded = await Memo.port.load(ref);
            }
        }
        if (loaded) {

            if (loaded.ref && typeof loaded.ref == 'function') {
                return loaded;
            }

            Memo.setRef(ref, loaded);

            return loaded;
        }
    }

    public async snap(obj: any): Promise<string> {
        if (this.parentRef !== undefined) {
            let type = this.defaultType || Memo.type(obj);
            let ref = this.parentRef + "/" + type + "/" + Memo.id(obj);
            await Memo.port.save(ref, obj);
            return ref;
        } else {
            let ref = Memo.ref(obj);
            await Memo.port.save(ref, obj);
            return ref;
        }
    }
}
