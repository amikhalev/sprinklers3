import { primitive, PropSchema } from "serializr";

function invariant(cond: boolean, message?: string) {
    if (!cond) {
        throw new Error("[serializr] " + (message || "Illegal ServerState"));
    }
}

function isPropSchema(thing: any) {
    return thing && thing.serializer && thing.deserializer;
}

function isAliasedPropSchema(propSchema: any) {
    return typeof propSchema === "object" && !!propSchema.jsonname;
}

function parallel(ar: any[], processor: (item: any, done: any) => void, cb: any) {
    if (ar.length === 0) {
        return void cb(null, []);
    }
    let left = ar.length;
    const resultArray: any[] = [];
    let failed = false;
    const processorCb = (idx: number, err: any, result: any) => {
        if (err) {
            if (!failed) {
                failed = true;
                cb(err);
            }
        } else if (!failed) {
            resultArray[idx] = result;
            if (--left === 0) {
                cb(null, resultArray);
            }
        }
    };
    ar.forEach((value, idx) => processor(value, processorCb.bind(null, idx)));
}

export default function list(propSchema: PropSchema): PropSchema {
    propSchema = propSchema || primitive();
    invariant(isPropSchema(propSchema), "expected prop schema as first argument");
    invariant(!isAliasedPropSchema(propSchema), "provided prop is aliased, please put aliases first");
    return {
        serializer(ar) {
            invariant(ar && typeof ar.length === "number" && typeof ar.map === "function",
                "expected array (like) object");
            return ar.map(propSchema.serializer);
        },
        deserializer(jsonArray, done, context) {
            if (jsonArray === null) { // sometimes go will return null in place of empty array
                return void done(null, []);
            }
            if (!Array.isArray(jsonArray)) {
                return void done("[serializr] expected JSON array", null);
            }
            parallel(
                jsonArray,
                (item: any, itemDone: (err: any, targetPropertyValue: any) => void) =>
                    propSchema.deserializer(item, itemDone, context, undefined),
                done,
            );
        },
    };
}
