declare type FilterFun = (x: any) => boolean;
declare type Filter = string | FilterFun;
export interface MemoPort {
    load(ref: string, type: string, id: string): Promise<any>;
    save(ref: string, type: string, id: string, obj: any): Promise<void>;
    list(ref: string, type: string): Promise<any[]>;
    find(ref: string, type: string, filter: Filter): Promise<any[]>;
    id(): string;
}
declare type TypeLike = string | {
    name: string;
};
export declare class Dict {
    private parent;
    private type;
    constructor(parent: any, name: TypeLike);
    constructor(name: TypeLike);
    save(id: string, obj: any): Promise<void>;
    get(id: string): Promise<any>;
}
export declare class Table {
    private parent;
    private type;
    constructor(parent: any, name: TypeLike);
    constructor(name: TypeLike);
    constructor();
    add(obj: any): Promise<string>;
    save(obj: any): Promise<string>;
    save(id: string, obj: any): Promise<string>;
    get(id: string): Promise<any>;
}
declare type Nullable<T> = T | null;
export declare class Memo {
    static port: MemoPort;
    static use(port: MemoPort): void;
    static id(obj: any): Nullable<string>;
    static parent(obj: any): Nullable<string>;
    static type(obj: any): Nullable<string>;
    static ref(obj: any): Nullable<string>;
    static save(obj: any): Promise<string>;
    static snap(obj: any): Promise<string>;
    static load(ref: string): Promise<any>;
    static load(id: string): Promise<any>;
    static load(typeId: string): Promise<any>;
    static load(type: TypeLike, id: string): Promise<any>;
    private static loadByRef;
    static list(type: TypeLike): Promise<any[]>;
    static find(type: TypeLike, filter: Filter): Promise<any[]>;
}
export {};
//# sourceMappingURL=Memo.d.ts.map