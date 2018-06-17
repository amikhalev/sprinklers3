import chalk from "chalk";
import pretty = require("pino/pretty");

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
    default: chalk.white.underline,
    60: chalk.bgRed.underline,
    50: chalk.red.underline,
    40: chalk.yellow.underline,
    30: chalk.green.underline,
    20: chalk.blue.underline,
    10: chalk.grey.underline,
};

const standardKeys = ["pid", "hostname", "name", "level", "time", "v", "source", "msg"];

function formatter(value: any) {
    let line = formatTime(value, " ");
    line += formatSource(value);
    line += asColoredLevel(value);

    // line += " (";
    // if (value.name) {
    //     line += value.name + "/";
    // }
    // line += value.pid + " on " + value.hostname + ")";

    const isRequest = value.req && value.res;

    line += ": ";
    if (isRequest) {
        line += chalk.reset(formatRequest(value));
        return line;
    }
    if (value.msg) {
        line += chalk.cyan(value.msg);
    }
    if (value.err) {
        line += "\n    " + withSpaces(value.err.stack) + "\n";
    } else {
        line += filter(value);
    }
    return line;
}

function formatRequest(value: any): string {
    const matches = /Content-Length: (\d+)/.exec(value.res.header);
    const contentLength = matches ? matches[1] : null;
    return `${value.req.remoteAddress} - ` +
        `"${value.req.method} ${value.req.url} ${value.res.statusCode}" ` +
        `${value.responseTime} ms - ${contentLength}`;
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
    const filteredKeys = standardKeys;
    let result = "";

    for (const key of keys) {
        if (filteredKeys.indexOf(key) < 0) {
            result += "\n    " + key + ": " + withSpaces(JSON.stringify(value[key], null, 2));
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

function formatSource(value: any) {
    if (value.source) {
        return chalk.magenta("(" + value.source + ") ");
    } else {
        return "";
    }
}

function asColoredLevel(value: any) {
    const level = value.level as Level;
    if (levelColors.hasOwnProperty(level)) {
        return levelColors[level](levels[level]);
    } else {
        return levelColors.default(levels.default);
    }
}

process.stdin.pipe(pretty({
    formatter,
})).pipe(process.stdout);
