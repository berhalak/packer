export declare function pack(name: string): (target: any) => void;
export declare function ignore(target: any, prop: string): void;
export declare type Packed<T> = any;
export declare class Packer {
    private static registry;
    static clone<T>(model: T): T;
    static pack(model: any): any;
    static ignores(model: any): any;
    static register(model: any): string;
    static unpack<T>(model: any): T;
    static serialize(model: any): string;
    static deserialize<T>(json: string): T;
}
//# sourceMappingURL=index.d.ts.map