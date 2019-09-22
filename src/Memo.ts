import { Packer } from "./Packer";

export const RefSymbol = Symbol.for("$ref");
const TypeSymbol = Symbol.for('$type');

export interface MemoPort {
    load(ref: string): Promise<any>;
    snap(ref: string, obj: any): Promise<void>;
    id(): string;
}

export interface MemoAdvancePort extends MemoPort {
    list(ref: string, type: string): Promise<any[]>;
    search(ref: string, type: string, filter: string): Promise<any[]>;
    get(ref: string, type: string, id: string): Promise<any>;
}

export class InMemory implements MemoAdvancePort {
    list(ref: string, type: string): Promise<any[]> {
        let r = Object.entries(this.db).filter(x => x[0].startsWith(ref) + "/" + type).map(x => x[1]);
        return Promise.resolve(r);
    }
    search(ref: string, type: string, filter: string): Promise<any[]> {
        return this.list(ref, type);
    }
    get(ref: string, type: string, id: string): Promise<any> {
        return this.load(ref + "/" + type + "/" + encodeURIComponent(id));
    }
    private db: any = {};
    load(ref: string): Promise<any> {
        let loaded = this.db[ref];
        return Promise.resolve(loaded);
    }
    snap(ref: string, obj: any): Promise<void> {
        this.db[ref] = obj;
        return Promise.resolve();
    }
    private _id = 1;
    id() {
        return (this._id++).toString();
    }
}

function setRef(ref: string, where: any) {
    if (typeof where.ref == 'function') {
        return;
    }
    delete where[RefSymbol];
    Object.defineProperty(where, RefSymbol, {
        value: ref,
        enumerable: false,
        configurable: true
    });
}

function last(a: any[], index?: number) {
    return a[a.length - 1 - (index || 0)];
}


function ctype(ctr: any) {
    if (ctr['$type']) {
        let type = ctr['$type'];
        type = type.split("#")[0];
        return type;
    } else {
        return ctr.name;
    }
}

type TypeLike = string | { name: string }

function typeName(typeLike: TypeLike): string {
    if (typeof typeLike == 'string') {
        return typeLike;
    }
    return ctype(typeLike);
}


export class Memo {
    private static port: MemoPort = new InMemory();

    public static use(port: MemoPort) {
        Memo.port = port;
    }

    public static async snap(parent: any | string, obj: any): Promise<string>;
    public static async snap(obj: any): Promise<string>;
    public static async snap(...args: any[]): Promise<string> {
        if (args.length == 1) {
            let obj = args[0];
            let ref = Memo.ref(obj);
            await Memo.port.snap(ref, Packer.pack(obj));
            return ref;
        } else {
            let parent = args[0];
            let obj = args[1];
            Memo.attach(parent, obj);
            let ref = Memo.ref(obj);
            await Memo.port.snap(ref, Packer.pack(obj));
            return ref;
        }
    }

    public static attach(parent: any, child: any) {
        let id = Memo.id(child);
        Memo.clear(child);
        let parentRef = typeof parent == 'string' ? parent : Memo.ref(parent);
        Memo.ref(child, { id, parent: parentRef });
    }

    public static ref(obj: any, def?: any): string {
        if (typeof obj.ref == 'function') {
            return obj.ref();
        }

        if (obj[RefSymbol]) {
            return obj[RefSymbol];
        }

        if (obj['$ref']) {
            return obj['$ref'];
        }

        let id = null;
        if (typeof obj.id == 'function') {
            id = obj.id();
        } else if (obj.id) {
            id = obj.id;
        } else if (def && def.id) {
            id = def.id;
        } else {
            id = Memo.port.id();
        }

        let type = "Object";
        if (typeof obj.col == 'function') {
            type = obj.col();
        } else {
            type = ctype(obj.constructor);
        }

        let parent = def && def.parent ? def.parent : "";

        id = encodeURIComponent(id);

        let ref = `${parent}/${type}/${id}`;
        setRef(ref, obj);
        return ref;
    }

    private static clear(obj: any) {
        delete obj[RefSymbol];
    }

    static id(obj: any) {
        let id = last(Memo.ref(obj).split('/'));
        return decodeURIComponent(id);
    }

    static type(obj: any) {
        let val = last(Memo.ref(obj).split('/'), 1);
        return val;
    }

    static parent(obj: any) {
        let parts = Memo.ref(obj).split('/');
        parts = parts.slice(0, parts.length - 2);
        return parts.join("/");
    }

    public static async load(ref: string): Promise<any>
    public static async load(id: string): Promise<any>
    public static async load(type: TypeLike, id: string): Promise<any>
    public static async load(parentRef: string, type: TypeLike, id: string): Promise<any>
    public static async load(parent: any, type: TypeLike, id: string): Promise<any>
    public static async load(...args: any[]): Promise<any> {

        async function loadByRef(ref: string): Promise<any> {
            let raw = await Memo.port.load(ref);
            if (!raw) {
                return null;
            }
            raw = Packer.unpack(raw);
            setRef(ref, raw);
            return raw;
        }

        if (args.length == 1) {
            let first = args[0] as string;
            if (first.startsWith('/')) {
                return await loadByRef(first);
            } else {
                first = encodeURIComponent(first);
                return await loadByRef('/Object/' + first)
            }
        } else if (args.length == 2) {
            let id = args[1] as string;
            let typeLike = args[0];
            let type = typeName(typeLike as TypeLike);
            id = encodeURIComponent(id);
            return await loadByRef(`/${type}/${id}`);
        } else if (args.length == 3) {
            let anyParent = args[0];
            let parent = typeof anyParent == 'string' ? anyParent : Memo.ref(anyParent);
            let type = typeName(args[1] as TypeLike);
            let id = args[2] as string;
            id = encodeURIComponent(id);
            return await loadByRef(`${parent}/${type}/${id}`);
        }
    }

    public static async list(parent: any, type: TypeLike): Promise<any[]> {
        let a = await (Memo.port as MemoAdvancePort).list(Memo.ref(parent), typeName(type));
        return a.map(x => Packer.unpack(x));
    }

    public static async get(parent: any, type: TypeLike, id: string): Promise<any> {
        let a = await (Memo.port as MemoAdvancePort).get(Memo.ref(parent), typeName(type), id);
        return a ? Packer.unpack(a) : null;
    }

    public static print(obj: any) {
        console.log("Id: " + Memo.id(obj));
        console.log("Type: " + Memo.type(obj));
        console.log("Ref: " + Memo.ref(obj));
        console.log("Parent: " + Memo.parent(obj));
    }
}