"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
test("Simple class test", () => {
    index_1.Packer.clear();
    class Upper {
        constructor(text) {
            this.data = {
                text
            };
        }
        toString() {
            return this.data.text.toUpperCase();
        }
    }
    index_1.Packer.register(Upper);
    const unpacked = index_1.Packer.unpack(index_1.Packer.pack(new Upper("lower")));
    expect(unpacked.toString()).toBe("LOWER");
    const unser = index_1.Packer.deserialize(index_1.Packer.serialize(new Upper("lower")));
    expect(unser.toString()).toBe("LOWER");
});
test("Type attribute", () => {
    index_1.Packer.clear();
    let Version1 = /** @class */ (() => {
        let Version1 = class Version1 {
            constructor(name) {
                this.name = name;
            }
            say() {
                return "Hello " + this.name;
            }
        };
        Version1 = __decorate([
            index_1.pack("version1")
        ], Version1);
        return Version1;
    })();
    let v1 = new Version1("John");
    let packed_v1 = index_1.Packer.pack(v1);
    let unpacked_v1 = index_1.Packer.unpack(packed_v1);
    const hello_v1 = unpacked_v1.say();
    if (hello_v1 != "Hello John") {
        throw new Error("Test failed");
    }
    if (packed_v1['$type'] != "version1") {
        throw new Error("Test failed");
    }
});
test("Ignore attribute", () => {
    let Model = /** @class */ (() => {
        class Model {
            constructor() {
                this.name = 'a';
            }
            hello() {
                return this.name;
            }
        }
        __decorate([
            index_1.ignore
        ], Model.prototype, "name", void 0);
        return Model;
    })();
    const m = index_1.Packer.clone(new Model());
    if (m.hello() == 'a')
        throw new Error("Ignore doesn't work");
});
test("Custom unpack function", () => {
    let ok = false;
    class CustomPack {
        constructor() {
            this.b = 2;
        }
        pack() {
            return {
                a: 1
            };
        }
        static unpack(data) {
            if (data.a == 1) {
                ok = true;
            }
            const fresh = new CustomPack();
            fresh.b = null;
            return fresh;
        }
        hello() {
            var _a;
            return (_a = this.b) !== null && _a !== void 0 ? _a : 3;
        }
    }
    if (index_1.Packer.unpack(index_1.Packer.pack(new CustomPack())).hello() != 3) {
        throw new Error("Pack and unpack doesn't work");
    }
    if (!ok)
        throw new Error("Wrong unpack");
});
test("Packer for builtin types", () => {
    // packing dates
    const d1 = new Date();
    const d2 = index_1.Packer.pack(d1);
    const d3 = index_1.Packer.unpack(d2);
    if (d1.toISOString() != d3.toISOString())
        throw "Date doesn't work";
    const s1 = new Set();
    s1.add("a");
    const s2 = index_1.Packer.pack(s1);
    const s3 = index_1.Packer.unpack(s2);
    if (!s3.has("a"))
        throw "Set doesn't work";
    const m1 = new Map();
    m1.set(5, "aa");
    const m2 = index_1.Packer.pack(m1);
    const m3 = index_1.Packer.unpack(m2);
    if (m3.get(5) != "aa")
        throw "Map doesn't work";
});
test("Internal tests", () => {
    class Test {
        constructor() {
            this.name = "a";
        }
    }
    const assert = (test) => expect(test).toBeTruthy();
    let packed = index_1.Packer.pack(new Test());
    assert(packed.$type);
    assert(packed.$type == 'Test');
    assert(packed.name);
    assert(packed.name == 'a');
    // double pack
    packed = index_1.Packer.pack(packed);
    assert(packed.$type);
    assert(packed.$type == 'Test');
    assert(packed.name);
    assert(packed.name == 'a');
    // change type and make sure it makes error
    packed.$type = 'Dummy';
    try {
        index_1.Packer.unpack(packed);
        throw "Should throw";
    }
    catch (_a) {
    }
});
test("Null pack", () => {
    const packedNull = index_1.Packer.pack(null);
    expect(packedNull).toBeNull();
});
test("Pack array", () => {
    /** Packagin arrays */
    class Value {
        constructor() {
            this.val = 10;
        }
    }
    class ListItem {
        constructor() {
            this.list = [new Value(), new Value()];
        }
    }
    const list = [new ListItem(), new ListItem(), new ListItem()];
    const unlist = index_1.Packer.deserialize(index_1.Packer.serialize(list));
    if (list[0].list[0].val != 10)
        throw new Error();
});
test("Static pack", () => {
    index_1.Packer.clear();
    class Child {
        constructor(name) {
            this.name = name;
        }
        toString() {
            return this.name;
        }
    }
    class Parent {
        constructor(name) {
            this.child = new Child("john");
            if (name)
                this.child = new Child(name);
        }
        static pack(p) {
            return { child: index_1.Packer.pack(p.child) };
        }
        static unpack(d) {
            const parent = new Parent("mary");
            expect(index_1.Packer.unpack(d.child).toString()).toBe("bob");
            return parent;
        }
    }
    const p = new Parent("bob");
    const p2 = index_1.Packer.unpack(index_1.Packer.pack(p));
    expect(p2.child.toString()).toBe("mary");
});
test("Child failure", () => {
    index_1.Packer.clear();
    class Child {
        constructor(name) {
            this.name = name;
        }
        toString() {
            return this.name;
        }
        static unpack(data) {
            throw new Error("Error");
        }
    }
    let ok = false;
    class Parent {
        constructor(name) {
            this.child = new Child("john");
            if (name)
                this.child = new Child(name);
        }
        static pack(p) {
            return { child: index_1.Packer.pack(p.child) };
        }
        static unpack(d) {
            const parent = new Parent();
            try {
                parent.child = index_1.Packer.unpack(d.child);
            }
            catch (e) {
                ok = true;
            }
            return parent;
        }
    }
    const p = new Parent("bob");
    const p2 = index_1.Packer.unpack(index_1.Packer.pack(p));
    expect(p2.child.toString()).toBe("john");
    expect(ok).toBeTruthy();
});
test("Instance pack without definition call", () => {
    index_1.Packer.clear();
    class Text {
        constructor(val) {
            this.val = val;
        }
        pack() {
            return { val: this.val };
        }
        unpack(data) {
            this.val += data.val + "b";
        }
    }
    class Model {
        constructor() {
            this.text = new Text("a");
        }
    }
    const m = new Model();
    const b = index_1.Packer.pack(m);
    m.text.val = "h";
    const m2 = index_1.Packer.unpack(b);
    // unpack is not called, as this wasn't a definition call
    expect(m2.text.val).toBe("a");
    // different instance
    expect(m2.text != m.text).toBeTruthy();
});
test("Instance pack same reference", () => {
    index_1.Packer.clear();
    class Text {
        constructor(val) {
            this.val = val;
        }
        pack() {
            return { val: this.val };
        }
        unpack(data) {
            this.val += data.val + "b";
        }
    }
    class Model {
        constructor() {
            this.text = new Text("a");
        }
    }
    const m = new Model();
    const b = index_1.Packer.pack(m);
    const m2 = index_1.Packer.restore(b, m);
    expect(m2.text.val).toBe("aab");
    // same instance
    expect(m2.text == m.text).toBeTruthy();
});
test("Instance pack complex", () => {
    index_1.Packer.clear();
    class Val {
        constructor(val) {
            this.val = val;
        }
        pack() {
            return { val: this.val };
        }
        unpack(data) {
            this.val += data.val + "b";
        }
    }
    class Text {
        constructor(val) {
            this.val = val;
        }
        pack() {
            return { val: this.val };
        }
        unpack(data) {
            this.val += data.val + "b";
        }
    }
    class Sample {
        constructor() {
            this.val = "b";
        }
    }
    class Model {
        constructor() {
            this.text = new Text("a");
            this.list = [new Val("a")];
            this.name = "a";
            this.sample = new Sample();
        }
    }
    const m = new Model();
    const b = index_1.Packer.pack(m);
    m.sample.val = "a";
    const m2 = index_1.Packer.restore(b, m);
    expect(m2.text.val).toBe("aab");
    expect(m2.list[0].val).toBe("aab");
    // same instance
    expect(m2.text == m.text).toBeTruthy();
    expect(m2.sample.val).toBe("b");
});
//# sourceMappingURL=test.spec.js.map