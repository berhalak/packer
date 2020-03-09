"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
function assert(ok) {
    if (!ok)
        throw "Error";
}
index_1.PackerLogger.debug = true;
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
if (unpacked.toString() != "LOWER") {
    throw new Error("Test failed");
}
const unser = index_1.Packer.deserialize(index_1.Packer.serialize(new Upper("lower")));
if (unser.toString() != "LOWER") {
    throw new Error("Test failed");
}
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
const m = index_1.Packer.clone(new Model());
if (m.hello() == 'a')
    throw new Error("Ignore doesn't work");
console.log(index_1.Packer.serialize([{ a: 1, b: new Model() }]));
console.log("Test passed");
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
    unpack(data) {
        if (data.a == 1) {
            ok = true;
        }
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
else
    console.log("Unpack works");
// packing dates
const d1 = new Date();
const d2 = index_1.Packer.pack(d1);
const d3 = index_1.Packer.unpack(d2);
if (d1.toISOString() != d3.toISOString())
    throw "Date doesnt work";
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
index_1.PackerLogger.print();
class Test {
    constructor() {
        this.name = "a";
    }
}
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
//# sourceMappingURL=test.js.map