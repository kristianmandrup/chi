import path from "path";
import webpack from "webpack";
// import BabiliPlugin from "babili-webpack-plugin";
const SOURCE = path.join(__dirname, "src");
const DESTINATION = path.join(__dirname, "dist");
const {
	NODE_ENV
} = process.env;
const isDebug = NODE_ENV === "development";
const commonOutput = {
	path: DESTINATION,
	filename: "[name].js"
};
const common = {
	cache: true,
	devtool: isDebug ? "inline-sourcemap" : false,
	watch: false,
	module: {
		rules: [{
			test: SOURCE,
			use: "babel-loader"
		}]
	},
	plugins: [].concat(isDebug ? [] : [
		new webpack.optimize.OccurrenceOrderPlugin()
		// new BabiliPlugin()
	])
};
const chi = {
	target: "web",
	output: {
		libraryTarget: "var",
		library: "chi",
		...commonOutput
	},
	entry: {
		index: "./src/index"
	}
};
const cli = {
	target: "node",
	output: {
		libraryTarget: "umd",
		...commonOutput
	},
	entry: {
		cli: "./src/cli"
	}
};
export default [
	Object.assign({}, common, chi),
	Object.assign({}, common, cli)
];