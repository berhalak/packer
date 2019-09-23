import { Memo, Table, Dict } from "./Memo";

function assert(condition: boolean) {
    if (!condition) {
        throw new Error();
    }
}
export async function memtest() {
    const snap = Memo.snap;
    const load = Memo.load;
    const save = Memo.save;

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
        constructor(private id: string, private name: string) {

        }

        hello() {
            return this.name;
        }
    }



    let person = await load(await snap(new Person("a", "John"))) as Person;
    assert(person.hello() == "John");
    let loadPerson = async (x: string) => (await load(Person, x) as Person);
    person = await loadPerson('a');
    assert(person.hello() == "John");

    // structures
    class Price {
        constructor(private value: number) {

        }

        price() {
            return this.value + "$";
        }
    }

    let price_ref = await save(new Price(20));

    let price = await load(price_ref) as Price;

    assert(price.price() == "20$");

    // objects
    class Car {
        constructor(public name: string) {

        }

        id() {
            return this.name;
        }

        async save() {
            await snap(this);
        }
    }

    class Cars {
        cars: Dict;
        constructor() {
            this.cars = new Dict("cars");
        }

        public async save(car: Car) {
            let ref = await snap(car);
            await this.cars.save(car.name, ref);
        }

        public async get(name: string) {
            // load my entry
            let ref = await this.cars.get(name) as string;
            let car = await load(ref) as Car;
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