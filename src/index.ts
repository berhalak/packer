function isObject(model: any) {
	return model && typeof model == 'object' && !Array.isArray(model);
}

const marker = '$type';

type NameLike = string | { name: string };

export function pack(name?: NameLike) {
	return function (target: any) {
		if (name) {
			target[marker] = typeof name == 'string' ? name : name.name;
		}
		Packer.register(target);
	}
}

const IGNORES = '$ignores';

export function ignore(target: any, prop: string) {
	target = target.constructor;
	target[IGNORES] = target[IGNORES] || {};
	target[IGNORES][prop] = true;
}

export type Packed<T> = any;
const version = "3.0.1";
export class PackerLogger {
	static debug = false;
	static print() {
		console.log("Types registered in Packer:" + version)
		for (let key in registry) {
			console.log(`${key} is registered to:`);
			console.log(registry[key]);
		}
		if (Object.keys(registry).length == 0) {
			console.log("No types registered");
		}
	}
}

let registry: any = {};



class ModelRegister {
	getById(model: string): any {
		return this._unpackMap.get(model);
	}
	was(model: string): boolean {
		return this._unpackMap.has(model);
	}
	remember(model: any, data: any) {
		if (model['/#PackerId#/'] !== undefined) {
			this._unpackMap.set(model['/#PackerId#/'], data);
		}
	}

	private _map = new Map<any, { id: string, packed: any }>();
	private _unpackMap = new Map<string, any>();

	has(model: any) {
		return this._map.has(model);
	}

	getId(model: any) {
		let entry = this._map.get(model);
		entry.packed['/#PackerId#/'] = entry.id;
		return entry.id;
	}

	set(model: any, packed: any) {
		this._map.set(model, { id: `/#PackerId:${this._map.size}#/`, packed });
	}
}

export class Packer {

	static clone<T>(model: T): T {
		return this.unpack(this.pack(model));
	}

	static clear() {
		registry = {};
	}

	static pack(model: any): any {
		return this._pack(model);
	}

	private static _pack(model: any, stack: ModelRegister = null): any {

		if (!model) {
			return null;
		}

		// if this is already packed
		if (model[marker]) {
			return model;
		}

		stack = stack ?? new ModelRegister();



		const type = this.register(model);

		if (type == 'Date') {
			return {
				id: (model as Date).toISOString(),
				[marker]: 'Date'
			}
		}

		if (type == 'Set') {
			return {
				values: [...(model as Set<any>).values()].map(x => Packer.pack(x)),
				[marker]: 'Set'
			}
		}

		if (type == 'Map') {
			const dict: any = {};
			const map = model as Map<any, any>;

			dict.keys = [...map.keys()].map(x => Packer.pack(x));
			dict.values = [...map.values()].map(x => Packer.pack(x));
			dict[marker] = 'Map';

			return dict;
		}

		const ignores = this.ignores(model);

		let packed: any = {};

		if (isObject(model)) {

			if (stack.has(model)) {
				return stack.getId(model);
			}

			if (typeof model.pack == 'function') {
				packed = model.pack();
				stack.set(model, packed);

			} else if (model.constructor && typeof model.constructor.pack == 'function') {
				packed = model.constructor.pack(model);
				stack.set(model, packed);

			} else {

				stack.set(model, packed);

				for (let key in model) {
					if (key.startsWith('$'))
						continue;
					if (key in ignores) {
						continue;
					}
					packed[key] = model[key];
				}
				for (let key in packed) {
					packed[key] = this._pack(packed[key], stack);
				}
			}
			if (type != Object.name && type)
				packed[marker] = type;

			return packed;
		} else if (Array.isArray(model)) {
			packed = (model as Array<any>).map(x => this._pack(x, stack));
			return packed;
		} else {
			return model;
		}

	}

	static ignores(model: any): any {
		if (!model) {
			return {};
		}
		if (typeof model == 'function') {
			return model.$ignores || {};
		} else if (isObject(model)) {
			return model?.constructor ? (model.constructor[IGNORES] ?? {}) : {};
		}
		return {};
	}

	static register(model: any): string {
		if (!model) {
			return null;
		}
		if (typeof model == 'function') {
			let type: string = model.name;
			if (model[marker]) {
				type = model[marker];
			}
			if (registry[type] !== model && PackerLogger.debug) {
				console.debug(`[Packer] Registering type ${type}`);
			}
			registry[type] = model;
			return type;
		} else if (isObject(model)) {
			return model.constructor ? this.register(model.constructor) : null;
		}
		return null;
	}


	static restore<T>(model: any, definition: T): T {
		if (Array.isArray(model)) {
			for (let i = 0; i < model.length; i++) {
				definition[i] = this.restore(model[i], definition[i])
			}
			return definition;

		} else if (isObject(definition)) {
			const obj = definition as any;

			if (typeof obj.unpack == 'function') {
				obj.unpack(model);
				return obj;
			}

			for (let key in obj) {
				let is = obj[key];
				if (is == null || is === undefined) {
					obj[key] = this.unpack(model[key]);
				} else {
					obj[key] = this.restore(model[key], is);
				}
			}

			return obj;

		} else {
			return model;
		}
	}

	static unpack<T>(model: any, def?: T): T {
		return this._unpack<T>(model, def);
	}

	private static _unpack<T>(model: any, def?: T, stack: ModelRegister = null): T {

		stack = stack ?? new ModelRegister();

		if (isObject(model)) {


			let data = def || {};
			const typeName = model[marker];
			if (typeName === undefined) {

				return model;
			}
			if (typeName == 'Object') {
				let data = {};
				stack.remember(model, data);

				for (let key in model) {
					if (key != marker) {
						data[key] = this._unpack(model[key], null, stack);
					}
				}
				return data as T;
			}
			if (typeName == "Date") {
				const date = new Date(model.id);
				return date as any;
			} else if (typeName == "Set") {
				const set = new Set(model.values.map(x => Packer._unpack(x, null, stack)));
				return set as any;
			} else if (typeName == "Map") {
				const set = new Map<any, any>();
				for (let i = 0; i < model.keys.length; i++) {
					set.set(model.keys[i], Packer._unpack(model.values[i], null, stack));
				}
				return set as any;
			}
			const ctr = registry[typeName];
			if (ctr) {

				if (ctr.unpack) {
					let obj = ctr.unpack(model);
					return obj;
				} else {
					stack.remember(model, data);

					for (let key in model) {
						if (key != marker) {
							data[key] = this._unpack(model[key], null, stack);
						}
					}
					Object.setPrototypeOf(data, ctr.prototype);
					return data as any;
				}
			} else {
				if (PackerLogger.debug) {
					console.debug(`[Packer] Type ${typeName} is not registered while unpacking:`);
					console.debug(data);
				}
				throw new Error(`Type ${typeName} is not registered`);
			}
		} else if (model && Array.isArray(model)) {
			return (model as any[]).map(x => this._unpack(x, null, stack)) as any;
		}

		if (typeof model == 'string') {
			if (stack.was(model)) {
				return stack.getById(model);
			}
		}

		return model as T;
	}

	static serialize(model: any): string {
		return JSON.stringify(this.pack(model));
	}

	static deserialize<T>(json: string): T {
		return this.unpack<T>(JSON.parse(json));
	}
}