declare type NameLike = string | {
    name: string;
};
export declare function pack(name?: NameLike): (target: any) => void;
export declare function ignore(target: any, prop: string): void;
export declare type Packed<T> = any;
export declare class PackerLogger {
    static debug: boolean;
    static print(): void;
}
export declare class Packer {
    static clone<T>(model: T): T;
    static clear(): void;
    static pack(model: any): any;
    private static _pack;
    static ignores(model: any): any;
    static register(model: any): string;
    static restore<T>(model: any, definition: T): T;
    static unpack<T>(model: any, def?: T): T;
    private static _unpack;
    static serialize(model: any): string;
    static deserialize<T>(json: string): T;
}
export {};
//# sourceMappingURL=index.d.ts.map