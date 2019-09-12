export interface MemoPort {
    save(ref: string, obj: any): Promise<void>;
    read(ref: string): Promise<any>;
    all(path: string): Promise<any[]>;
    find(path: string, filter: string): Promise<any[]>;
}

export class InMemory implements MemoPort {
    public db: any = {}
    save(ref: string, obj: any): Promise<void> {
        this.db[ref] = obj;
        return Promise.resolve();
    }
    read(ref: string): Promise<any> {
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
}

export class Memo {
    private static port: MemoPort = new InMemory();
    public static use(port: MemoPort) {
        Memo.port = port;
    }
    public static id(any: any): string {
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
        return id;
    }
    public static self(any: any): string {
        return Memo.parent(any) + "/" + Memo.type(any) + "/" + Memo.id(any);

    }
    public static ref(any: any): string {
        if (typeof any.ref == 'function') {
            return any.ref();
        }
        return Memo.self(any);
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
        (child as any)['$parent'] = Memo.ref(parent);
        return child;
    }
    public static parent(any: any): string {
        if (typeof any.parent == 'function') {
            return any.parent();
        }
        if (any['$parent']) {
            return any["$parent"];
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

    public static save(obj: any): Promise<string> {
        return Memo.current.save(obj);
    }

    public static read(ref: string): Promise<any> {
        return Memo.current.read(ref);
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

    public async read(refId: string): Promise<any> {
        if (this.parentRef !== undefined) {
            if (!refId.includes("/")) {
                // it has only id
                let proper = this.parentRef + "/" + (this.defaultType || "Object") + "/" + refId;
                return await Memo.port.read(proper);
            } else {
                let proper = this.parentRef + "/" + refId;
                return await Memo.port.read(proper);
            }
        } else {
            if (!refId.startsWith("/")) {
                return await Memo.port.read("/Object/" + refId);
            }
            return await Memo.port.read(refId);
        }
    }

    public async save(obj: any): Promise<string> {
        if (this.parentRef !== undefined) {
            let type = this.defaultType || Memo.type(obj);
            let ref = this.parentRef + "/" + type + "/" + Memo.id(obj);
            await Memo.port.save(ref, obj);
            return ref;
        } else {
            await Memo.port.save(Memo.ref(obj), obj);
            return Memo.ref(obj);
        }
    }
}
