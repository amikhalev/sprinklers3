import * as pino from "pino";

import browserLogger from "./browserLogger";

const logger: pino.Logger = pino({
  serializers: pino.stdSerializers,
  browser: browserLogger,
  level: "trace"
});

export default logger;
