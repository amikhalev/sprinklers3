export function checkedIndexOf<T>(o: T | number, arr: T[], type: string = "object"): number {
    const idx = (typeof o === "number")
        ? o
        : arr.indexOf(o);
    if (idx < 0 || idx > arr.length) {
        throw new Error(`Invalid ${type} specified: ${o}`);
    }
    return idx;
}

export function getRandomId() {
    return Math.floor(Math.random() * 1000000000);
}
