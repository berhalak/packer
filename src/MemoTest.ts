import { Memo } from "./Memo";

function assert(condition: boolean) {
    if (!condition) {
        throw new Error();
    }
}
export async function memtest() {
    const snap = Memo.snap;
    const load = Memo.load;

    const obj = { name: 'john' };

    const john = await snap(obj);

    Memo.print(obj);
    console.log(obj);

    class IdModel {
        constructor(public id: string) {

        }
    }

    let w = new IdModel("a");
    Memo.print(w);



}