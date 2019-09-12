"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InMemory {
    constructor() {
        this.db = {};
    }
    save(ref, obj) {
        this.db[ref] = obj;
        return Promise.resolve();
    }
    read(ref) {
        return Promise.resolve(this.db[ref]);
    }
    all(path) {
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
    find(path, filter) {
        return this.all(path);
    }
}
exports.InMemory = InMemory;
class Memo {
    constructor(arg, type) {
        if (arg) {
            if (typeof arg == 'string') {
                this.parentRef = arg;
            }
            else {
                this.parentRef = Memo.ref(arg);
            }
            this.defaultType = type;
        }
    }
    static use(port) {
        Memo.port = port;
    }
    static id(any) {
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
    static self(any) {
        return Memo.parent(any) + "/" + Memo.type(any) + "/" + Memo.id(any);
    }
    static ref(any) {
        if (typeof any.ref == 'function') {
            return any.ref();
        }
        return Memo.self(any);
    }
    static type(any) {
        if (typeof any.type == 'function') {
            return any.type();
        }
        let type = '';
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
    static attach(parent, child) {
        child['$parent'] = Memo.ref(parent);
        return child;
    }
    static parent(any) {
        if (typeof any.parent == 'function') {
            return any.parent();
        }
        if (any['$parent']) {
            return any["$parent"];
        }
        return "";
    }
    static print(any) {
        console.log("Id: " + Memo.id(any));
        console.log("Type: " + Memo.type(any));
        console.log("Parent ref: " + Memo.parent(any));
        console.log("Ref: " + Memo.ref(any));
    }
    static save(obj) {
        return Memo.current.save(obj);
    }
    static read(ref) {
        return Memo.current.read(ref);
    }
    async read(refId) {
        if (this.parentRef !== undefined) {
            if (!refId.includes("/")) {
                // it has only id
                let proper = this.parentRef + "/" + (this.defaultType || "Object") + "/" + refId;
                return await Memo.port.read(proper);
            }
            else {
                let proper = this.parentRef + "/" + refId;
                return await Memo.port.read(proper);
            }
        }
        else {
            if (!refId.startsWith("/")) {
                return await Memo.port.read("/Object/" + refId);
            }
            return await Memo.port.read(refId);
        }
    }
    async save(obj) {
        if (this.parentRef !== undefined) {
            let type = this.defaultType || Memo.type(obj);
            let ref = this.parentRef + "/" + type + "/" + Memo.id(obj);
            await Memo.port.save(ref, obj);
            return ref;
        }
        else {
            await Memo.port.save(Memo.ref(obj), obj);
            return Memo.ref(obj);
        }
    }
}
exports.Memo = Memo;
Memo.port = new InMemory();
Memo.current = new Memo();
//# sourceMappingURL=Memo.js.map