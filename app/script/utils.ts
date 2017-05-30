export function checkedIndexOf<T>(o: T | number, arr: T[], type: string = "object"): number {
    let idx: number;
    if (typeof o === "number") {
        idx = o;
    } else {
        idx = arr.indexOf(o);
    }
    if (idx < 0 || idx > arr.length) {
        throw new Error(`Invalid ${type} specified: ${o}`);
    }
    return idx;
}
