import gulp from "gulp";
import gutil from "gulp-util";
import esLint from "gulp-eslint";
import webpack from "webpack";
import webpackConfiguration from "./webpack.config.babel";
/**
* Transpiles ES files
* @returns {Promise}
*	A promise that resolves if transpilation is successful and rejects with an error otherwise.
*/
export function transpileES() {
	return new Promise((resolve, reject) => {
		webpack(webpackConfiguration, (err, stats) => {
			if (err) {
				gutil.log(new gutil.PluginError("[webpack]", err.message));
				reject(err.message);
			}
			gutil.log("[webpack]", stats.toString({
				colors: true
			}));
			resolve();
		});
	});
}
/**
* Lints ES files
* @returns {stream}
*	A gulp stream
*/
export function lint() {
	return gulp.src(["**/*.js", "!node_modules/**"])
		.pipe(esLint())
		.pipe(esLint.format());
}
export default transpileES;