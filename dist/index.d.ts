export declare class Packer {
    private static cache;
    private static type_indicator;
    static pack(model: any, typeSelector?: string): any;
    static unpack<T>(model: object, typeSelector?: string): T;
    static serialize(model: any, typeSelector?: string): string;
    static deserialize<T>(packed: string, typeSelector?: string): T;
    static register(...constructor: any[]): void;
    static registerSafe<T>(constructor: new (...args: any[]) => T, warn?: boolean): string;
    private static updateTypeInfo;
    private static updatePrototypes;
    static unpackSafe<T>(model: any): any;
}
//# sourceMappingURL=index.d.ts.map