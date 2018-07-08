import log from "@common/logger";
import expressPinoLogger = require("express-pino-logger");
import * as pino from "pino";

const l = pino();
pino(l);

export default expressPinoLogger(log);
