export interface MemoPort {
    save(ref: string, obj: any): Promise<void>;
    read(ref: string): Promise<any>;
    all(path: string): Promise<any[]>;
    find(path: string, filter: string): Promise<any[]>;
}
export declare class InMemory implements MemoPort {
    db: any;
    save(ref: string, obj: any): Promise<void>;
    read(ref: string): Promise<any>;
    all(path: string): Promise<any[]>;
    find(path: string, filter: string): Promise<any[]>;
}
export declare class Memo {
    private static port;
    static use(port: MemoPort): void;
    static id(any: any): string;
    static self(any: any): string;
    static ref(any: any): string;
    static type(any: any): string;
    static attach<T>(parent: any, child: T): T;
    static parent(any: any): string;
    static print(any: any): void;
    static current: Memo;
    static save(obj: any): Promise<string>;
    static read(ref: string): Promise<any>;
    private parentRef;
    private defaultType;
    constructor();
    constructor(obj: any, type?: string);
    constructor(ref: string, type?: string);
    read(refId: string): Promise<any>;
    save(obj: any): Promise<string>;
}
//# sourceMappingURL=Memo.d.ts.map