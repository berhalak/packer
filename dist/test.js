"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
class Name {
    constructor(name) {
        this.name = name;
    }
    print() {
        console.log(this.name);
    }
    id() {
        return this.name;
    }
}
let john = new Name("john");
let names = [john];
class Person {
    constructor(...names) {
        this.names = names;
    }
    hello() {
        console.log("Hello, my name is " + this.names.map(x => x.id()).join(", "));
    }
}
let king = new Person(new Name("Richard"), new Name("Bob"));
_1.Packer.register(Name, Person);
let packed = _1.Packer.pack(king);
console.log(packed);
let unpacked = _1.Packer.unpack(packed);
unpacked.hello();
//# sourceMappingURL=test.js.map