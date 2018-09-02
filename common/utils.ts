export function checkedIndexOf<T>(
  o: T | number,
  arr: T[],
  type: string = "object"
): number {
  let idx: number;
  if (typeof o === "number") {
    idx = o;
  } else if (typeof (o as any).id === "number") {
    idx = (o as any).id;
  } else {
    idx = arr.indexOf(o);
  }
  if (idx < 0 || idx > arr.length) {
    throw new Error(`Invalid ${type} specified: ${o}`);
  }
  return idx;
}

export function getRandomId() {
  return Math.floor(Math.random() * 1000000000);
}

export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      derivedCtor.prototype[name] = baseCtor.prototype[name];
    });
  });
}
