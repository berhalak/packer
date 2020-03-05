import { Packer, pack, ignore, PackerLogger } from './index';
function assert(ok: any) {
    if (!ok) throw "Error";
}
PackerLogger.debug = true;

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

let ok = false;
class CustomPack {
    pack() {
        return {
            a: 1
        }
    }
    unpack(data) {
        if (data.a == 1) {
            ok = true;
        }
    }
    b = 2;
    hello() {
        return this.b ?? 3;
    }
}

if (Packer.unpack<CustomPack>(Packer.pack(new CustomPack())).hello() != 3) {
    throw new Error("Pack and unpack doesn't work")
}

if (!ok) throw new Error("Wrong unpack");
else console.log("Unpack works");


// packing dates
const d1 = new Date();
const d2 = Packer.pack(d1);
const d3 = Packer.unpack<Date>(d2);
if (d1.toISOString() != d3.toISOString()) throw "Date doesnt work"

const s1 = new Set<string>(); s1.add("a");
const s2 = Packer.pack(s1);
const s3 = Packer.unpack<Set<string>>(s2);
if (!s3.has("a")) throw "Set doesn't work";

const m1 = new Map<number, string>(); m1.set(5, "aa");
const m2 = Packer.pack(m1);
const m3 = Packer.unpack<Map<number, string>>(m2);
if (m3.get(5) != "aa") throw "Map doesn't work";

PackerLogger.print();

class Test {
    name = "a";
}

let packed = Packer.pack(new Test());
assert(packed.$type);
assert(packed.$type == 'Test');
assert(packed.name);
assert(packed.name == 'a');

// double pack
packed = Packer.pack(packed);
assert(packed.$type);
assert(packed.$type == 'Test');
assert(packed.name);
assert(packed.name == 'a');

// change type and make sure it makes error
packed.$type = 'Dummy';
Packer.unpack(packed);
