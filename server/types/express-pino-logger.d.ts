declare module "express-pino-logger" {
    import { Logger } from "pino";
    import { ErrorRequestHandler } from "express";

    function makeLogger(logger: Logger): ErrorRequestHandler;
    export = makeLogger;
} 