import { Packer, pack, ignore } from './index';

class Upper {
    data: { text: string };
    constructor(text: string) {
        this.data = {
            text
        }
    }
    public toString() {
        return this.data.text.toUpperCase();
    }
}

Packer.register(Upper);

const unpacked = Packer.unpack<Upper>(Packer.pack(new Upper("lower")))

if (unpacked.toString() != "LOWER") {
    throw new Error("Test failed")
}

const unser = Packer.deserialize<Upper>(Packer.serialize(new Upper("lower")))

if (unser.toString() != "LOWER") {
    throw new Error("Test failed")
}

@pack("version1")
class Version1 {
    constructor(private name: string) {

    }
    say() {
        return "Hello " + this.name;
    }
}

let v1 = new Version1("John");

let packed_v1 = Packer.pack(v1);

let unpacked_v1 = Packer.unpack<Version1>(packed_v1);

const hello_v1 = unpacked_v1.say();

if (hello_v1 != "Hello John") {
    throw new Error("Test failed");
}

if (packed_v1['$type'] != "version1") {
    throw new Error("Test failed");
}


class Model {
    @ignore
    name = 'a';

    hello() {
        return this.name;
    }
}

const m = Packer.clone(new Model());

if (m.hello() == 'a')
    throw new Error("Ignore doesn't work");


console.log(Packer.serialize([{ a: 1, b: new Model() }]));

console.log("Test passed");