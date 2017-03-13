import Lexer from "./Lexer";
import Parser from "./Parser";
import interpret from "./Interpreter";
import { log, debug, err } from "print-log";
import { readFileSync } from "fs";
import { inspect } from "util";
debug("Tokenizing…");
const lexer = new Lexer();
const tokens = lexer.tokenize(readFileSync("src/example.chi", "utf-8"));
debug("Parsing…");
debug(tokens.tokens);
const parser = new Parser(tokens.tokens);
const ast = parser.Block();
if (parser.errors.length) {
	err(parser.errors);
}
debug("Below is the resulting AST");
debug(inspect(ast, {
	depth: null,
	showHidden: false
}));
try {
// 	const [result, store] = interpret(ast);
// 	debug(store);
// 	debug(result);
}
catch (e) {
	err(e);
	process.exit(1);
}