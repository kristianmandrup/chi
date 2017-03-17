import Lexer from "./Lexer";
import Parser from "./Parser";
import interpret from "./Interpreter";
import checkTypes from "./TypeSystem";
import { debug, err } from "print-log";
import { inspect } from "util";
export function run(source) {
	debug("Tokenizing source…");
	const lexer = new Lexer();
	const { tokens } = lexer.tokenize(source);
	debug("Tokenization successful. Token stream is shown below.");
	debug(tokens);
	debug("Parsing tokens…");
	const parser = new Parser(tokens);
	const ast = parser.Block();
	if (parser.errors.length) {
		err("Parsing failed.");
		throw new Error(parser.errors);
	}
	debug("AST generation successful. AST is shown below.");
	try {
		debug(inspect(ast, {
			depth: null,
			showHidden: false
		}));
		debug("Checking types…");
		checkTypes(ast);
		debug("Type check successful.");
		debug("Interpreting…");
		const [result, store] = interpret(ast);
		debug(store);
		debug(result);
		return {
			result,
			store
		};
	}
	catch (e) {
		err(`"${e.constructor.name}": ${e.message}`);
		throw e;
	}
}
export default run;