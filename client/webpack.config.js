const path = require("path");
const webpack = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const DashboardPlugin = require("webpack-dashboard/plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const { loadEnv, getClientEnvironment } = require("./env");

function getConfig(env) {
  const { isProd, isDev } = loadEnv(env);

  const paths = require("../paths");

  // Webpack uses `publicPath` to determine where the app is being served from.
  // It requires a trailing slash, or the file assets will get an incorrect path.
  const publicPath = paths.publicPath;
  // `publicUrl` is just like `publicPath`, but we will provide it to our app
  // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
  // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
  const publicUrl = paths.publicUrl.slice(0, -1);
  // Source maps are resource heavy and can cause out of memory issue for large source files.
  const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";
  const shouldExtractCss = process.env.EXTRACT_CSS
    ? process.env.EXTRACT_CSS === "true"
    : isProd;
  // Get environment variables to inject into our app.
  const environ = getClientEnvironment(env, publicUrl);
  
  const postCssConfig = {
    loader: require.resolve("postcss-loader"),
    options: {
      // Necessary for external CSS imports to work
      // https://github.com/facebookincubator/create-react-app/issues/2677
      ident: "postcss",
      plugins: () => [
        require("postcss-flexbugs-fixes"),
        require("postcss-preset-env")({
          stage: 0
        })
      ]
    }
  };

  const sassConfig = {
    loader: require.resolve("sass-loader"),
    options: {}
  };

  // "postcss" loader applies autoprefixer to our CSS.
  // "css" loader resolves paths in CSS and adds assets as dependencies.
  // "style" loader turns CSS into JS modules that inject <style> tags.
  // In production, we use a plugin to extract that CSS to a file, but
  // in development "style" loader enables hot editing of CSS.
  const styleLoader = shouldExtractCss
    ? {
        loader: MiniCssExtractPlugin.loader
      }
    : require.resolve("style-loader");
  const cssRule = {
    test: /\.css$/,
    use: [
      styleLoader,
      {
        loader: require.resolve("css-loader"),
        options: {
          importLoaders: 1
        }
      },
      postCssConfig
    ]
  };
  const sassRule = {
    test: /\.scss$/,
    use: [
      styleLoader,
      {
        loader: require.resolve("css-loader"),
        options: {
          importLoaders: 1
        }
      },
      postCssConfig,
      sassConfig
    ]
  };

  const rules = [
    {
      // "oneOf" will traverse all following loaders until one will
      // match the requirements. when no loader matches it will fall
      // back to the "file" loader at the end of the loader list.
      oneOf: [
        // "url" loader works like "file" loader except that it embeds assets
        // smaller than specified limit in bytes as data urls to avoid requests.
        // a missing `test` is equivalent to a match.
        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          loader: require.resolve("url-loader"),
          options: {
            limit: env === "production" ? 10000 : 0,
            name: "static/media/[name].[hash:8].[ext]"
          }
        },
        cssRule,
        sassRule,
        // Process TypeScript with TSC through HappyPack.
        {
          test: /\.tsx?$/,
          include: [paths.clientDir, paths.commonDir],
          use: [
            { loader: "cache-loader" },
            {
              loader: "thread-loader",
              options: {
                workers: require("os").cpus().length - 1
              }
            },
            {
              loader: "ts-loader",
              options: {
                configFile: paths.clientTsConfig,
                happyPackMode: true
              }
            }
          ]
        },
        // "file" loader makes sure those assets get served by WebpackDevServer.
        // When you `import` an asset, you get its (virtual) filename.
        // In production, they would get copied to the `build` folder.
        // This loader doesn"t use a "test" so it will catch all modules
        // that fall through the other loaders.
        {
          // Exclude `js` files to keep "css" loader working as it injects
          // it"s runtime that would otherwise processed through "file" loader.
          // Also exclude `html` and `json` extensions so they get processed
          // by webpacks internal loaders.
          exclude: [/\.js$/, /\.html$/, /\.json$/],
          loader: require.resolve("file-loader"),
          options: {
            name: "static/media/[name].[hash:8].[ext]"
          }
        }
      ]
    }
  ];

  const plugins = [
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.clientHtml,
      minify: isProd
        ? {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true
          }
        : undefined
    }),
    new FaviconsWebpackPlugin(
      path.resolve(paths.clientDir, "images", "favicon-96x96.png")
    ),
    // Makes some environment variables available to the JS code, for example:
    // if (process.env.NODE_ENV === "production") { ... }. See `./env.js`.
    // It is absolutely essential that NODE_ENV was set to production here.
    // Otherwise React will be compiled in the very slow development mode.
    new webpack.DefinePlugin(environ.stringified),
    new CaseSensitivePathsPlugin(),
    isProd &&
      new UglifyJsPlugin({
        sourceMap: shouldUseSourceMap
      }),
    isDev && new webpack.HotModuleReplacementPlugin(),
    new ForkTsCheckerWebpackPlugin({
      checkSyntacticErrors: true,
      tsconfig: paths.clientTsConfig,
      tslint: paths.tslintConfig
    }),
    isDev && new DashboardPlugin(),
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
      openAnalyzer: false,
      reportFilename: path.resolve(paths.serverBuildDir, "report.html")
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    isProd &&
      new MiniCssExtractPlugin({
        filename: "static/css/[name].[chunkhash:8].css",
        chunkFilename: "static/css/[id].[chunkhash:8].css"
      })
  ].filter(Boolean);

  return {
    mode: isProd ? "production" : "development",
    bail: isProd,
    devtool: shouldUseSourceMap
      ? isProd
        ? "source-map"
        : "inline-source-map"
      : false,
    entry: [
      isDev && require.resolve("react-hot-loader/patch"),
      isDev && require.resolve("react-dev-utils/webpackHotDevClient"),
      require.resolve("./polyfills"),
      paths.clientEntry
    ].filter(Boolean),
    output: {
      path: paths.clientBuildDir,
      pathinfo: isDev,
      filename: isProd
        ? "static/js/[name].[chunkhash:8].js"
        : "static/js/bundle.js",
      chunkFilename: isProd
        ? "static/js/[name].[chunkhash:8].chunk.js"
        : "static/js/[name].chunk.js",
      publicPath: publicPath,
      devtoolModuleFilenameTemplate: isDev
        ? info =>
            "webpack://" +
            path.resolve(info.absoluteResourcePath).replace(/\\/g, "/")
        : undefined
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".json", ".scss"],
      alias: {
        "@client": paths.clientDir,
        "@common": paths.commonDir
      }
    },
    module: { rules },
    plugins: plugins,
    optimization: {
      namedModules: isProd
    },
    devServer: {
      hot: true,
      historyApiFallback: true,
      host: "0.0.0.0",
      port: 8081,
      proxy: [
        {
          context: ["/api"],
          target: paths.publicUrl
        }
      ]
    }
  };
}

module.exports = getConfig;
