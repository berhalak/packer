import { Packer } from "./Packer";

export interface MemoPort {
    load(ref: string, type: string, id: string): Promise<any>;
    save(ref: string, type: string, id: string, obj: any): Promise<void>;
    id(): string;
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

export class Dict {
    private parent: string;
    private type: string;

    constructor(parent: any, name: TypeLike)
    constructor(name: TypeLike)
    constructor(...args: any[]) {
        let parent = args.length == 1 ? '' : args[0];
        let name = args.length == 1 ? args[0] : args[1];

        this.parent = (parent ? (typeof (parent) == 'string' ? parent : Memo.ref(parent)) : "") || "";
        this.type = typeName(name);
    }

    public async save(id: string, obj: any): Promise<void>
    public async save(...args: any[]): Promise<void> {
        let id = '';
        let obj = null;
        if (args.length == 1) {
            obj = args[0];
            id = Memo.id(obj) || Memo.port.id();
        } else {
            id = args[0];
            obj = args[1];
        }
        if (typeof obj == 'object') {

        } else {
            obj = { _value: obj };
        }
        await Memo.port.save(this.parent, this.type, encodeURIComponent(id), Packer.pack(obj));
    }

    public async get(id: string): Promise<any> {
        let data = await Memo.port.load(this.parent, this.type, encodeURIComponent(id));
        let unpacked: any = data ? Packer.unpack(data) : null;
        if (unpacked && unpacked._value) {
            return unpacked._value;
        } else {
            if (unpacked && !unpacked.id) {
                unpacked.id = id;
            }
            if (unpacked && Memo.type(unpacked) != this.type) {
                unpacked.type = this.type;
            }
            if (unpacked && Memo.parent(unpacked) != this.parent && this.parent) {
                unpacked.parent = this.parent;
            }
        }
        return unpacked;
    }
}

export class Table {
    private parent: string;
    private type: string;

    constructor(parent: any, name: TypeLike)
    constructor(name: TypeLike)
    constructor()
    constructor(...args: any[]) {
        if (args.length == 0) {
            this.parent = '';
            this.type = Object.name;
        } else {
            let parent = args.length == 1 ? '' : args[0];
            let name = args.length == 1 ? args[0] : args[1];
            this.parent = (parent ? (typeof (parent) == 'string' ? parent : Memo.ref(parent)) : "") || "";
            this.type = typeName(name);
        }
    }

    public async add(obj: any) {
        return await this.save(obj);
    }

    public async save(obj: any): Promise<string>
    public async save(id: string, obj: any): Promise<string>
    public async save(...args: any[]): Promise<string> {
        let id = '';
        let obj = null;
        if (args.length == 1) {
            obj = args[0];
            id = Memo.id(obj) || Memo.port.id();
        } else {
            id = args[0];
            obj = args[1];
        }
        await Memo.port.save(this.parent, this.type, encodeURIComponent(id), Packer.pack(obj));
        return id;
    }

    public async get(id: string): Promise<any> {
        let data = await Memo.port.load(this.parent, this.type, encodeURIComponent(id));
        let unpacked: any = data ? Packer.unpack(data) : null;
        if (unpacked && !unpacked.id) {
            unpacked.id = id;
        }
        if (unpacked && Memo.type(unpacked) != this.type) {
            unpacked.type = this.type;
        }
        if (unpacked && Memo.parent(unpacked) != this.parent && this.parent) {
            unpacked.parent = this.parent;
        }
        return unpacked;
    }
}

type Nullable<T> = T | null;

class InMemory implements MemoPort {
    db: any = {};
    load(ref: string, type: string, id: string): Promise<any> {
        let key = ref + "/" + type + "/" + id;
        return Promise.resolve(this.db[key]);
    }
    save(ref: string, type: string, id: string, obj: any): Promise<void> {
        let key = ref + "/" + type + "/" + id;
        this.db[key] = obj;
        return Promise.resolve();
    }

    private static _id = 1;

    id(): string {
        return `id${InMemory._id++}`;
    }
}

export class Memo {

    static port: MemoPort = new InMemory();

    public static use(port: MemoPort) {
        Memo.port = port;
    }

    public static id(obj: any): Nullable<string> {
        if (!obj) {
            return null;
        }
        let id = null;
        if (typeof obj.id == 'function') {
            id = obj.id();
        } else if (obj.id) {
            id = obj.id;
        }
        return id;
    }

    public static parent(obj: any): Nullable<string> {
        if (!obj) return null;
        if (typeof obj.parent == 'function') return obj.parent();
        if (typeof obj.parent == 'string') return obj.parent;
        return null;
    }

    public static type(obj: any): Nullable<string> {
        if (!obj) return null;

        let type = "Object";
        if (typeof obj.col == 'function') {
            type = obj.col();
        } else if (typeof obj.type == 'function') {
            type = obj.type();
        } else if (typeof obj.type == 'string') {
            type = obj.type;
        } else {
            type = ctype(obj.constructor);
        }
        return type;
    }

    public static ref(obj: any): Nullable<string> {
        if (!obj) {
            return null;
        }

        if (typeof obj.ref == 'function') return obj.ref();
        if (obj.ref) return obj.ref;

        let id = Memo.id(obj);
        let type = Memo.type(obj);
        let parent = Memo.parent(obj);
        let ref = `${parent}/${type}/${id}`;
        return ref;
    }

    public static async save(obj: any): Promise<string> {
        let id = Memo.id(obj);
        if (!id) {
            id = Memo.port.id();
            obj.id = id;
        }
        return await Memo.snap(obj);
    }

    public static async snap(obj: any): Promise<string> {
        let parent = Memo.parent(obj) as string;
        let type = Memo.type(obj) as string;
        let id = Memo.id(obj) as string;

        if (id === null || type === null) {
            throw new Error("Can't snap objects without id or type");
        }

        parent = parent || "";

        let packed = Packer.pack(obj);

        let ref = `${parent}/${type}/${id}`;

        await Memo.port.save(parent, type, encodeURIComponent(id), packed);

        return ref;
    }

    public static async load(ref: string): Promise<any>
    public static async load(id: string): Promise<any>
    public static async load(typeId: string): Promise<any>
    public static async load(type: TypeLike, id: string): Promise<any>
    public static async load(...args: any[]): Promise<any> {
        if (args.length == 1) {
            return await Memo.loadByRef(args[0]);
        } else {
            let type = typeName(args[0] as TypeLike);
            let id = args[1];
            return await Memo.loadByRef(`${type}/${encodeURIComponent(id)}`);
        }
    }

    private static async loadByRef(ref: string): Promise<any> {
        let parent = '';
        let type = '';
        let id = '';

        if (ref.startsWith('/')) {
            let parts = ref.split('/');
            parent = parts.slice(0, -2).join("/");
            type = parts.slice(-2, -1).join('');
            id = parts.slice(-1).join();
        } else if (ref.includes('/')) {
            let parts = ref.split('/');
            type = parts[0];
            id = parts[1];
        } else {
            id = ref;
            type = Object.name;
            parent = '';
        }

        let data = await Memo.port.load(parent, type, id);
        if (data) data = Packer.unpack(data);
        return data;
    }
}