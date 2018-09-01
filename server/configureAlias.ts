import * as moduleAlias from "module-alias";
import * as path from "path";
moduleAlias.addAlias("@common", path.resolve(__dirname, "common"));
moduleAlias.addAlias("@server", __dirname);
moduleAlias.addAlias("paths", path.resolve(__dirname, "..", "paths"));
