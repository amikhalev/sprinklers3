import log, { setLogger } from "@common/logger";
setLogger(log.child({
    name: "sprinklers3/server",
    level: "debug",
}));
