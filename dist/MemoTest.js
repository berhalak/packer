"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Memo_1 = require("./Memo");
function assert(condition) {
    if (!condition) {
        throw new Error();
    }
}
async function memtest() {
    const snap = Memo_1.Memo.snap;
    const load = Memo_1.Memo.load;
    const save = Memo_1.Memo.save;
    // save and load normal objects
    let pojo = { name: 'test' };
    let pojo_loaded = await load(await save(pojo));
    pojo.name = "changed";
    assert('test' == pojo_loaded.name);
    // save and load normal objects with id
    let withId = { id: "a", name: 'test' };
    await snap(withId);
    let loadedId = await load('a');
    assert('test' == loadedId.name);
    loadedId = await load(Object, 'a');
    assert('test' == loadedId.name);
    // objects with id
    class Person {
        constructor(id, name) {
            this.id = id;
            this.name = name;
        }
        hello() {
            return this.name;
        }
    }
    let person = await load(await snap(new Person("a", "John")));
    assert(person.hello() == "John");
    let loadPerson = async (x) => await load(Person, x);
    person = await loadPerson('a');
    assert(person.hello() == "John");
    // structures
    class Price {
        constructor(value) {
            this.value = value;
        }
        price() {
            return this.value + "$";
        }
    }
    let price_ref = await save(new Price(20));
    let price = await load(price_ref);
    assert(price.price() == "20$");
    // objects
    class Car {
        constructor(name) {
            this.name = name;
        }
        id() {
            return this.name;
        }
        async save() {
            await snap(this);
        }
    }
    class Cars {
        constructor() {
            this.cars = new Memo_1.Dict("cars");
        }
        async save(car) {
            let ref = await snap(car);
            await this.cars.save(car.name, ref);
        }
        async get(name) {
            // load my entry
            let ref = await this.cars.get(name);
            let car = await load(ref);
            return car;
        }
    }
    let car = new Car("skoda");
    let cars = new Cars();
    await cars.save(car);
    let skoda = await cars.get("skoda");
    assert(skoda.name == "skoda");
    console.log("Memo test passed");
}
exports.memtest = memtest;
//# sourceMappingURL=MemoTest.js.map