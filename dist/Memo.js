"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Packer_1 = require("./Packer");
function ctype(ctr) {
    if (ctr['$type']) {
        let type = ctr['$type'];
        type = type.split("#")[0];
        return type;
    }
    else {
        return ctr.name;
    }
}
function typeName(typeLike) {
    if (typeof typeLike == 'string') {
        return typeLike;
    }
    return ctype(typeLike);
}
class Dict {
    constructor(...args) {
        let parent = args.length == 1 ? '' : args[0];
        let name = args.length == 1 ? args[0] : args[1];
        this.parent = (parent ? (typeof (parent) == 'string' ? parent : Memo.ref(parent)) : "") || "";
        this.type = typeName(name);
    }
    async save(...args) {
        let id = '';
        let obj = null;
        if (args.length == 1) {
            obj = args[0];
            id = Memo.id(obj) || Memo.port.id();
        }
        else {
            id = args[0];
            obj = args[1];
        }
        if (typeof obj == 'object') {
        }
        else {
            obj = { _value: obj };
        }
        await Memo.port.save(this.parent, this.type, encodeURIComponent(id), Packer_1.Packer.pack(obj));
    }
    async get(id) {
        let data = await Memo.port.load(this.parent, this.type, encodeURIComponent(id));
        let unpacked = data ? Packer_1.Packer.unpack(data) : null;
        if (unpacked && unpacked._value) {
            return unpacked._value;
        }
        else {
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
exports.Dict = Dict;
class Table {
    constructor(...args) {
        if (args.length == 0) {
            this.parent = '';
            this.type = Object.name;
        }
        else {
            let parent = args.length == 1 ? '' : args[0];
            let name = args.length == 1 ? args[0] : args[1];
            this.parent = (parent ? (typeof (parent) == 'string' ? parent : Memo.ref(parent)) : "") || "";
            this.type = typeName(name);
        }
    }
    async add(obj) {
        return await this.save(obj);
    }
    async save(...args) {
        let id = '';
        let obj = null;
        if (args.length == 1) {
            obj = args[0];
            id = Memo.id(obj) || Memo.port.id();
        }
        else {
            id = args[0];
            obj = args[1];
        }
        await Memo.port.save(this.parent, this.type, encodeURIComponent(id), Packer_1.Packer.pack(obj));
        return id;
    }
    async get(id) {
        let data = await Memo.port.load(this.parent, this.type, encodeURIComponent(id));
        let unpacked = data ? Packer_1.Packer.unpack(data) : null;
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
exports.Table = Table;
class InMemory {
    constructor() {
        this.db = {};
    }
    load(ref, type, id) {
        let key = ref + "/" + type + "/" + id;
        return Promise.resolve(this.db[key]);
    }
    save(ref, type, id, obj) {
        let key = ref + "/" + type + "/" + id;
        this.db[key] = obj;
        return Promise.resolve();
    }
    id() {
        return `id${InMemory._id++}`;
    }
}
InMemory._id = 1;
class Memo {
    static use(port) {
        Memo.port = port;
    }
    static id(obj) {
        if (!obj) {
            return null;
        }
        let id = null;
        if (typeof obj.id == 'function') {
            id = obj.id();
        }
        else if (obj.id) {
            id = obj.id;
        }
        return id;
    }
    static parent(obj) {
        if (!obj)
            return null;
        if (typeof obj.parent == 'function')
            return obj.parent();
        if (typeof obj.parent == 'string')
            return obj.parent;
        return null;
    }
    static type(obj) {
        if (!obj)
            return null;
        let type = "Object";
        if (typeof obj.col == 'function') {
            type = obj.col();
        }
        else if (typeof obj.type == 'function') {
            type = obj.type();
        }
        else if (typeof obj.type == 'string') {
            type = obj.type;
        }
        else {
            type = ctype(obj.constructor);
        }
        return type;
    }
    static ref(obj) {
        if (!obj) {
            return null;
        }
        if (typeof obj.ref == 'function')
            return obj.ref();
        if (obj.ref)
            return obj.ref;
        let id = Memo.id(obj);
        let type = Memo.type(obj);
        let parent = Memo.parent(obj);
        let ref = `${parent}/${type}/${id}`;
        return ref;
    }
    static async save(obj) {
        let id = Memo.id(obj);
        if (!id) {
            id = Memo.port.id();
            obj.id = id;
        }
        return await Memo.snap(obj);
    }
    static async snap(obj) {
        let parent = Memo.parent(obj);
        let type = Memo.type(obj);
        let id = Memo.id(obj);
        if (id === null || type === null) {
            throw new Error("Can't snap objects without id or type");
        }
        parent = parent || "";
        let packed = Packer_1.Packer.pack(obj);
        let ref = `${parent}/${type}/${id}`;
        await Memo.port.save(parent, type, encodeURIComponent(id), packed);
        return ref;
    }
    static async load(...args) {
        if (args.length == 1) {
            return await Memo.loadByRef(args[0]);
        }
        else {
            let type = typeName(args[0]);
            let id = args[1];
            return await Memo.loadByRef(`${type}/${encodeURIComponent(id)}`);
        }
    }
    static async loadByRef(ref) {
        let parent = '';
        let type = '';
        let id = '';
        if (ref.startsWith('/')) {
            let parts = ref.split('/');
            parent = parts.slice(0, -2).join("/");
            type = parts.slice(-2, -1).join('');
            id = parts.slice(-1).join();
        }
        else if (ref.includes('/')) {
            let parts = ref.split('/');
            type = parts[0];
            id = parts[1];
        }
        else {
            id = ref;
            type = Object.name;
            parent = '';
        }
        let data = await Memo.port.load(parent, type, id);
        if (data)
            data = Packer_1.Packer.unpack(data);
        return data;
    }
}
exports.Memo = Memo;
Memo.port = new InMemory();
//# sourceMappingURL=Memo.js.map