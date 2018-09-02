import log from "@common/logger";
Object.assign(log, {
  name: "sprinklers3/server",
  level: process.env.LOG_LEVEL || "debug"
});
