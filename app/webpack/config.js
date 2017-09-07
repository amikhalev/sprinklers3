const isProduction = process.env.NODE_ENV === "production";

module.exports = require(
    isProduction ? "./prod.config.js" : "./dev.config.js"
);
