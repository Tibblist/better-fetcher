/*module.exports = {
	entry: './src/better-fetcher.js',
	output: {
	  filename: 'better-fetcher.min.js',
	  library: 'betterFetcher'
	},
	mode: 'development'
	}
*/

var webpack = require("webpack");
var path = require("path");
var libraryName = "betterFetcher";
var outputFile = libraryName + ".js";

var env = process.env.WEBPACK_ENV;

var outputFile,
  mode = "development";

if (env === "build") {
  outputFile = libraryName + ".min.js";
  mode = "production";
} else {
  outputFile = libraryName + ".js";
}

var config = {
  entry: __dirname + "/src/better-fetcher.js",
  devtool: "source-map",
  output: {
    path: __dirname + "/lib",
    filename: outputFile,
    library: libraryName,
    libraryTarget: "umd",
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /(\\.jsx|\\.js)$/,
        loader: "babel",
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /(\\.jsx|\\.js)$/,
        loader: "eslint-loader",
        exclude: /node_modules/
      }
    ]
  },
  mode: mode
};

module.exports = config;
