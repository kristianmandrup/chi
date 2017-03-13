import nearley from "nearley";
import grammar from "./grammar";
import equal from "deep-equal";
import { err, debug } from "print-log";
import { Number, True, False, And, Or, Not, Add, Subtract, Multiply, Divide, Block, Statement, Let, Id, Function, ParameterList, Apply } from "./InterpreterClasses";
export default class Parser {
	internalParser;
	constructor() {
		this.internalParser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
	}
	locate(source, character) {
		return {
			line: "not implemented",
			column: "not implemented",
		};
		const sourceTillHere = source.substring(0, character);
		const line = sourceTillHere.split("\n").length;
		const lineStart = 1 + sourceTillHere.lastIndexOf("\n");
		const column = 1 + Array.from(sourceTillHere.substring(lineStart, character)).length;
		return {
			line,
			column
		};
	}
	objectify(source, arrayAST) {
		if (typeof arrayAST === "string") {
			err("AST error: Read string");
		}
		const objectify = ast => this.objectify(source, ast);
		const [title, character, rest] = arrayAST;
		const location = this.locate(source, character);
		debug(`Transforming "${title}"`);
		debug(arrayAST, rest);
		switch (title) {
			case "Block": {
				return new Block(location, ...rest.map(ast => objectify(ast)));
			}
			case "VariableDeclaration": {
				const [idExpression, expression] = rest;
				const id = objectify(idExpression);
				if (!(id instanceof Id)) {
					err("Can not declare variable: idExpression is not an identifier expression");
					process.exit(1);
				}
				else {
					const { name } = id;
					return new Let(location, name, objectify(expression));
				}
			}
			case "Identifier": {
				const [name] = rest;
				// console.log("rest", rest)
				return new Id(location, name);
			}
			// case "Statement": {
			// 	const [onlyValue] = rest;
			// 	return new Statement(location, objectify(onlyValue));
			// }
			case "NumberLiteral": {
				const [onlyValue] = rest;
				return new Number(location, global.Number(onlyValue));
			}
			case "AndExpression": {
				const [lhs, rhs] = rest;
				return new And(objectify(lhs), objectify(rhs), location);
			}
			case "OrExpression": {
				const [lhs, rhs] = rest;
				return new Or(objectify(lhs), objectify(rhs), location);
			}
			case "NotExpression": {
				const [op] = rest;
				return new Not(objectify(op), location);
			}
			case "BooleanLiteral": {
				const [onlyValue] = rest;
				if (onlyValue === "true") {
					return new True(location);
				}
				else {
					return new False(location);
				}
			}
			case "FunctionLiteral": {
				const [parameters, body] = rest;
				return new Function(location, parameters.map(parameter => objectify(parameter)), objectify(body));
			}
			case "FunctionApplication": {
				const [target, args] = rest;
				return new Apply(location, objectify(target), args.map(arg => objectify(arg)));
			}
			case "AdditionExpression": {
				const [lhs, rhs] = rest;
				return new Add(objectify(lhs), objectify(rhs), location);
			}
			case "SubtractionExpression": {
				const [lhs, rhs] = rest;
				return new Subtract(objectify(lhs), objectify(rhs), location);
			}
			case "MultiplicationExpression": {
				const [lhs, rhs] = rest;
				return new Multiply(objectify(lhs), objectify(rhs), location);
			}
			case "DivisionExpression": {
				const [lhs, rhs] = rest;
				return new Divide(objectify(lhs), objectify(rhs), location);
			}
			default: {
				debug(`"${title}": No interpreter class bound.`);
				process.exit(1);
			}
		}
	}
	parse(source) {
		try {
			const { results: fakeResults } = this.internalParser.feed(source);
			console.log("Fake results:", fakeResults.length);
			/* Parser bug: Sometimes, there are multiple derivations that are exactly the same. Remove those. */
			let results = [];
			// function hideLocations(ast) {
			// 	const [title, character, content] = ast;
			// 	if (title.endsWith("Literal")) {
			// 		return [title, content];
			// 	}
			// 	else {
			// 		console.log(content);
			// 		return [title, content.map(ast => hideLocations(ast))];
			// 	}
			// }
			for (const fakeResult of fakeResults) {
				let add = true;
				for (const result of results) {
					if (equal(fakeResult, result)) {
						add = false;
						break;
					}
				}
				if (add) {
					results.push(fakeResult);
				}
			}
			const hasKeywordIdentifiers = ast => {
				// const o = this.objectify(source, ast);
				// console.log(o);
				const [title, character, content] = ast;
				const containsKeywords = node => {
					const [title, character, content] = node;
					const [onlyValue] = content;
					return title === "Identifier" && (onlyValue === "true" || onlyValue === "false")
				}
				const [firstChild] = content;
				if (firstChild.length === 3) {
					/* This element contains further AST children */
					return content
						.map(ast => hasKeywordIdentifiers(ast))
						.some(e => {
							return e;
						});
				}
				else {
					if (content.length === 1 && typeof content[0] === "string") {
						const [onlyValue] = content;
						console.log("[" + title + "] The only value found in this AST was ", onlyValue);
						return title === "Identifier" && (onlyValue === "true" || onlyValue === "false")
					}
					else {
						console.log("repeat for", title, content[0])
						return containsKeywords(ast);
					}
				}
			};
			/*
				Next, we need a way to differentiate reserved words and identifiers.
				Doing this with a BNF is hard; let's just filter every AST that contains them.
			*/
			results = results.filter(result => {
				// console.log("hi");
				const x = !hasKeywordIdentifiers(result);
				// console.log("therefore", x);
				return x;
			});
			if (results.length === 0) {
				err("Parse error: No program provided");
				process.exit(1);
			}
			if (results.length > 1) {
				err("Grammar error: Ambiguous syntax", JSON.stringify(results, null, 4));
				process.exit(1);
			}
			else {
				const [derivation] = results;
				debug(require("util").inspect(derivation, {
					depth: null,
					breakLength: 0
				}));
				debug(JSON.stringify(derivation, null, 2));
				return this.objectify(source, derivation);
			}
		}
		catch (e) {
			const location = this.locate(source, e.offset);
			err(`Syntax error: At line "${location.line}", column "${location.column}": "${e.message}"`);
			throw e;
			process.exit(1);
		}
	}
}