const fs = require("fs");
const dotenv = require("dotenv");
const paths = require("../paths")

const validEnvs = ["production", "development"];

exports.loadEnv = function loadEnv(env) {
  if (validEnvs.indexOf(env) === -1) {
    throw new Error("Must specify webpack --env as one of: " + validEnvs.join(','));
  }

  const dotenvFiles = [
    `${paths.dotenv}.${env}.local`,
    `${paths.dotenv}.${env}`,
    // Don"t include `.env.local` for `test` environment
    // since normally you expect tests to produce the same
    // results for everyone
    env !== "test" && `${paths.dotenv}.local`,
    paths.dotenv,
  ].filter(Boolean);

  dotenvFiles.forEach(dotenvFile => {
    if (fs.existsSync(dotenvFile)) {
      dotenv.config({
        path: dotenvFile,
      });
    }
  });

  delete require.cache[require.resolve("../paths")]; // so new env applies

  return {
    isProd: env === "production",
    isDev: env === "development"
  };
}

// Grab NODE_ENV and REACT_APP_* environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.
const REACT_APP = /^REACT_APP_/i;

exports.getClientEnvironment = function getClientEnvironment(env, publicUrl) {
  const raw = Object.keys(process.env)
    .filter(key => REACT_APP.test(key))
    .reduce(
      (env, key) => {
        env[key] = process.env[key];
        return env;
      }, {
        // Useful for determining whether we’re running in production mode.
        // Most importantly, it switches React into the correct mode.
        NODE_ENV: process.env.NODE_ENV || env,
        // Useful for resolving the correct path to static assets in `public`.
        // For example, <img src={process.env.PUBLIC_URL + "/img/logo.png"} />.
        // This should only be used as an escape hatch. Normally you would put
        // images into the `src` and `import` them in code to get their paths.
        PUBLIC_URL: publicUrl,
      },
    );
  // Stringify all values so we can feed into Webpack DefinePlugin
  const stringified = {
    "process.env": Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };

  return {
    raw,
    stringified
  };
};