const path = require("path");
const fs = require("fs");
const url = require("url");

exports.rootDir = fs.realpathSync(process.cwd());
const resolveRoot = exports.resolveRoot = (p) => path.resolve(exports.rootDir, p);

function ensureSlash(p, needsSlash) {
    const hasSlash = p.endsWith("/");
    if (hasSlash && !needsSlash) {
        return p.substr(p, p.length - 1);
    } else if (!hasSlash && needsSlash) {
        return `${p}/`;
    } else {
        return p;
    }
}

exports.dotenv = resolveRoot(".env");
exports.nodeModulesDir = resolveRoot("node_modules");
exports.packageJson = resolveRoot("package.json");
exports.publicUrl = ensureSlash(process.env.PUBLIC_URL || "http://localhost:8080/", true);
exports.publicPath = ensureSlash(url.parse(exports.publicUrl).pathname || "/", true);

exports.commonDir = resolveRoot("common");

exports.clientDir = resolveRoot("client");
exports.clientEntry = path.resolve(exports.clientDir, "index.tsx");
exports.clientHtml = path.resolve(exports.clientDir, "index.html");
exports.clientWebpackConfig = path.resolve(exports.clientDir, "webpack.config.js");
exports.clientTsConfig = path.resolve(exports.clientDir, "tsconfig.json");
exports.clientBuildDir = resolveRoot("public");
exports.publicDir = exports.clientBuildDir;

exports.serverDir = resolveRoot("server");
exports.serverBuildDir = resolveRoot("dist");
