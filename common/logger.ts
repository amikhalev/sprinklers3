import * as pino from "pino";

type Level = "default" | 60 | 50 | 40 | 30 | 20 | 10;

const levels = {
    default: "USERLVL",
    60: "FATAL",
    50: "ERROR",
    40: "WARN",
    30: "INFO",
    20: "DEBUG",
    10: "TRACE",
};

const levelColors = {
    default: "text-decoration: underline; color: #000000;",
    60: "text-decoration: underline; background-color: #FF0000;",
    50: "text-decoration: underline; color: #FF0000;",
    40: "text-decoration: underline; color: #FFFF00;",
    30: "text-decoration: underline; color: #00FF00;",
    20: "text-decoration: underline; color: #0000FF;",
    10: "text-decoration: underline; color: #AAAAAA;",
};

interface ColoredString {
    str: string;
    args: any[];
}

function makeColored(str: string = ""): ColoredString {
    return { str, args: [] };
}

function concatColored(...coloredStrings: ColoredString[]): ColoredString {
    return coloredStrings.reduce((prev, cur) => ({
        str: prev.str + cur.str,
        args: prev.args.concat(cur.args),
    }), makeColored());
}

const standardKeys = ["pid", "hostname", "name", "level", "time", "v", "source", "msg"];

function formatter(value: any) {
    let line = concatColored(
        // makeColored(formatTime(value, " ")),
        formatSource(value),
        formatLevel(value),
        makeColored(": "),
    );

    if (value.msg) {
        line = concatColored(line, {
            str: "%c" + value.msg, args: ["color: #00FFFF"],
        });
    }
    let args = [line.str].concat(line.args);
    if (value.type === "Error") {
        args = args.concat([value.stack]);
    } else {
        args = args.concat([filter(value)]);
    }
    let fn;
    if (value.level >= 50) {
        fn = console.error;
    } else if (value.level >= 40) {
        fn = console.warn;
    } else {
        fn = console.log;
    }
    fn.apply(null, args);
}

function withSpaces(value: string): string {
    const lines = value.split("\n");
    for (let i = 1; i < lines.length; i++) {
        lines[i] = "    " + lines[i];
    }
    return lines.join("\n");
}

function filter(value: any) {
    const keys = Object.keys(value);
    const result: any = {};

    for (const key of keys) {
        if (standardKeys.indexOf(key) < 0) {
            result[key] = value[key];
        }
    }

    return result;
}

function asISODate(time: string) {
    return new Date(time).toISOString();
}

function formatTime(value: any, after?: string) {
    after = after || "";
    try {
        if (!value || !value.time) {
            return "";
        } else {
            return "[" + asISODate(value.time) + "]" + after;
        }
    } catch (_) {
        return "";
    }
}

function formatSource(value: any): { str: string, args: any[] } {
    if (value.source) {
        return { str: "%c(" + value.source + ") ", args: ["color: #FF00FF"] };
    } else {
        return { str: "", args: [] };
    }
}

function formatLevel(value: any): ColoredString {
    const level = value.level as Level;
    if (levelColors.hasOwnProperty(level as string)) {
        return {
            str: "%c" + levels[level] + "%c",
            args: [levelColors[level], ""],
        };
    } else {
        return {
            str: levels.default,
            args: [levelColors.default],
        };
    }
}

let logger: pino.Logger = pino({
    browser: { write: formatter },
    level: "trace",
});

export function setLogger(newLogger: pino.Logger) {
    logger = newLogger;
}

export default logger;
