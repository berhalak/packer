"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
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
_1.Packer.register(Upper);
const unpacked = _1.Packer.unpack(_1.Packer.pack(new Upper("lower")));
if (unpacked.toString() != "LOWER") {
    throw new Error("Test failed");
}
const unser = _1.Packer.deserialize(_1.Packer.serialize(new Upper("lower")));
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
    _1.pack("version1")
], Version1);
let v1 = new Version1("John");
let packed_v1 = _1.Packer.pack(v1);
let unpacked_v1 = _1.Packer.unpack(packed_v1);
const hello_v1 = unpacked_v1.say();
if (hello_v1 != "Hello John") {
    throw new Error("Test failed");
}
if (packed_v1['$type'] != "version1") {
    throw new Error("Test failed");
}
console.log("Test passed");
//# sourceMappingURL=PackerTest.js.map