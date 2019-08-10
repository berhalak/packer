"use strict";
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
console.log("Test passed");
//# sourceMappingURL=test.js.map