const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/bos.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bos.js",
    library: "Bos",
    libraryTarget: "umd",
    libraryExport: "default",
    globalObject: "this",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
