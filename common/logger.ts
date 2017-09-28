import * as pino from "pino";

let logger: pino.Logger = pino();

export function setLogger(newLogger: pino.Logger) {
    logger = newLogger;
}

export default logger;
