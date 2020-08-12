import { Packer, pack, ignore, PackerLogger } from './index';


test("Simple class test", () => {
	Packer.clear();

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

	expect(unpacked.toString()).toBe("LOWER");

	const unser = Packer.deserialize<Upper>(Packer.serialize(new Upper("lower")))
	expect(unser.toString()).toBe("LOWER");
})

test("Type attribute", () => {
	Packer.clear();

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
})

test("Ignore attribute", () => {
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
})

test("Custom unpack function", () => {

	let ok = false;
	class CustomPack {
		pack() {
			return {
				a: 1
			}
		}
		static unpack(data) {
			if (data.a == 1) {
				ok = true;
			}
			const fresh = new CustomPack();
			fresh.b = null;
			return fresh;
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
})

test("Packer for builtin types", () => {
	// packing dates
	const d1 = new Date();
	const d2 = Packer.pack(d1);
	const d3 = Packer.unpack<Date>(d2);
	if (d1.toISOString() != d3.toISOString()) throw "Date doesn't work"

	const s1 = new Set<string>(); s1.add("a");
	const s2 = Packer.pack(s1);
	const s3 = Packer.unpack<Set<string>>(s2);
	if (!s3.has("a")) throw "Set doesn't work";

	const m1 = new Map<number, string>(); m1.set(5, "aa");
	const m2 = Packer.pack(m1);
	const m3 = Packer.unpack<Map<number, string>>(m2);
	if (m3.get(5) != "aa") throw "Map doesn't work";
})

test("Internal tests", () => {

	class Test {
		name = "a";
	}

	const assert = (test: boolean) => expect(test).toBeTruthy();

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
	try {
		Packer.unpack(packed);
		throw "Should throw";
	} catch {

	}
})


test("Null pack", () => {
	const packedNull = Packer.pack(null);
	expect(packedNull).toBeNull();
})

test("Pack array", () => {
	/** Packagin arrays */

	class Value {
		val = 10;
	}

	class ListItem {
		list = [new Value(), new Value()];
	}

	const list = [new ListItem(), new ListItem(), new ListItem()];

	const unlist = Packer.deserialize(Packer.serialize(list)) as ListItem[];

	if (list[0].list[0].val != 10) throw new Error();
})

test("Static pack", () => {
	Packer.clear();

	class Child {
		constructor(public name: string) { }
		toString() {
			return this.name
		}
	}

	class Parent {
		child = new Child("john");

		constructor(name?: string) {
			if (name)
				this.child = new Child(name);
		}

		static pack(p: Parent) {
			return { child: Packer.pack(p.child) }
		}

		static unpack(d: any) {
			const parent = new Parent("mary");
			expect(Packer.unpack<Child>(d.child).toString()).toBe("bob");
			return parent;
		}
	}

	const p = new Parent("bob");
	const p2 = Packer.unpack(Packer.pack(p)) as Parent;
	expect(p2.child.toString()).toBe("mary");
})


test("Child failure", () => {
	Packer.clear();

	class Child {
		constructor(public name: string) { }
		toString() {
			return this.name
		}
		static unpack(data: any) {
			throw new Error("Error");
		}
	}

	let ok = false;

	class Parent {
		child = new Child("john");

		constructor(name?: string) {
			if (name)
				this.child = new Child(name);
		}

		static pack(p: Parent) {
			return { child: Packer.pack(p.child) }
		}

		static unpack(d: any) {
			const parent = new Parent();
			try {
				parent.child = Packer.unpack(d.child);
			} catch (e) {
				ok = true;
			}
			return parent;
		}
	}

	const p = new Parent("bob");
	const p2 = Packer.unpack(Packer.pack(p)) as Parent;
	expect(p2.child.toString()).toBe("john");
	expect(ok).toBeTruthy();
})

test("Instance pack without definition call", () => {
	Packer.clear();

	class Text {
		constructor(public val: string) {

		}

		pack() {
			return { val: this.val }
		}

		unpack(data: { val: string }) {
			this.val += data.val + "b";
		}
	}

	class Model {
		text = new Text("a");
	}

	const m = new Model();
	const b = Packer.pack(m);
	m.text.val = "h";
	const m2 = Packer.unpack(b) as Model;

	// unpack is not called, as this wasn't a definition call
	expect(m2.text.val).toBe("a");
	// different instance
	expect(m2.text != m.text).toBeTruthy();
})

test("Instance pack same reference", () => {
	Packer.clear();

	class Text {
		constructor(public val: string) {

		}

		pack() {
			return { val: this.val }
		}

		unpack(data: { val: string }) {
			this.val += data.val + "b";
		}
	}

	class Model {
		text = new Text("a");
	}

	const m = new Model();
	const b = Packer.pack(m);
	const m2 = Packer.restore(b, m);

	expect(m2.text.val).toBe("aab");
	// same instance
	expect(m2.text == m.text).toBeTruthy();
})

test("Instance pack complex", () => {
	Packer.clear();

	class Val {
		constructor(public val: string) {

		}

		pack() {
			return { val: this.val }
		}

		unpack(data: { val: string }) {
			this.val += data.val + "b";
		}
	}

	class Text {
		constructor(public val: string) {

		}

		pack() {
			return { val: this.val }
		}

		unpack(data: { val: string }) {
			this.val += data.val + "b";
		}
	}

	class Sample {
		val = "b";
	}

	class Model {
		text = new Text("a");
		list = [new Val("a")]
		name = "a";
		sample = new Sample();
	}

	const m = new Model();
	const b = Packer.pack(m);
	m.sample.val = "a";
	const m2 = Packer.restore(b, m) as Model;

	expect(m2.text.val).toBe("aab");
	expect(m2.list[0].val).toBe("aab");
	// same instance
	expect(m2.text == m.text).toBeTruthy();

	expect(m2.sample.val).toBe("b");
})


test('Recursion', () => {
	Packer.clear();


	class Parent {
		child: Child[] = [];
	}

	class Child {
		parent: Parent = null;
		child: Child = null;
	}

	let p = new Parent();
	let c = new Child();
	c.parent = p;
	c.child = c;
	p.child.push(c);

	let clone = Packer.clone(p);

	expect(clone).toBe(clone.child[0].parent);
	expect(clone.child[0]).toBe(clone.child[0].child);
})