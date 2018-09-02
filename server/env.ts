import * as fs from "fs";

// tslint:disable-next-line:no-var-requires
const paths = require("paths");

const NODE_ENV = process.env.NODE_ENV || "development";

const dotenvFiles: string[] = [
  `${paths.dotenv}.${NODE_ENV}.local`,
  `${paths.dotenv}.${NODE_ENV}`,
  // Don"t include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  NODE_ENV !== "test" && `${paths.dotenv}.local`,
  paths.dotenv
].filter(Boolean) as string[];

dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    require("dotenv").config({
      path: dotenvFile
    });
  }
});
