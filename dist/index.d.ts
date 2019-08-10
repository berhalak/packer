export declare class Packer {
    private static map;
    private static defaultTypeSelector;
    private static currentType;
    private static fillNames;
    private static onDeserializeHandler;
    private static fillProtos;
    static register(...constructor: any[]): void;
    static registerSafe<T>(constructor: new (...args: any[]) => T, warn?: boolean): string;
    static serialize(model: any, typeSelector?: string): string;
    static pack(model: any, typeSelector?: string): any;
    static deserialize<T>(packed: string, typeSelector?: string): T;
    static unpack<T>(model: object, typeSelector?: string): T;
    static unpackSafe<T>(model: any): any;
}
//# sourceMappingURL=index.d.ts.map