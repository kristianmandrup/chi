import { Parser, tokenMatcher } from "chevrotain";
import { debug } from "print-log";
import {
	allTokens,
	Let,
	Identifier,
	Equals,
	NumberLiteral,
	StringLiteral,
	PowerLiteral,
	BoolLiteral,
	BitwiseOrOperator,
	BitwiseXorOperator,
	BitwiseAndOperator,
	AndOperator,
	OrOperator,
	NotOperator,
	Semicolon,
	AdditiveOperator,
	Plus,
	Minus,
	MultiplicativeOperator,
	Asterisk,
	Slash,
	RemainderOperator,
	ModuloOperator,
	ExponentiationOperator,
	LeftParenthesis,
	RightParenthesis,
	LeftCurlyBrace,
	RightCurlyBrace,
	LeftSquareBracket,
	RightSquareBracket,
	FatArrow,
	Comma,
	Colon,
	Type
} from "./Lexer";
import {
	Program,
	LetStatement,
	NumberValue,
	StringValue,
	Int32Value,
	BoolValue,
	LogicalOr,
	LogicalAnd,
	BitwiseOr,
	BitwiseXor,
	BitwiseAnd,
	Not,
	Id,
	Block,
	Add,
	Subtract,
	Multiply,
	Divide,
	RemainderExpression,
	ModuloExpression,
	Power,
	FunctionExpression,
	Apply,
	Cast
} from "./InterpreterClasses";
function parseSuperScript(value) {
	const superscripts = "⁰¹²³⁴⁵⁶⁷⁸⁹";
	return Number.parseInt(Array.from(value).map(c => String(superscripts.indexOf(c))).join(""));
}
function getLocation(token) {
	const { startLine, endLine, startColumn, endColumn } = token;
	return {
		start: {
			line: startLine,
			column: startColumn
		},
		end: {
			line: endLine,
			column: endColumn
		}
	};
}
export default class ChiParser extends Parser {
	constructor(input) {
		super(input, allTokens, {
			outputCst: true
		});
		this.RULE("program", () => {
			this.SUBRULE(this.sourceElements);
		});
		this.RULE("sourceElements", () => {
			this.AT_LEAST_ONE(() => this.SUBRULE(this.sourceElement));
		});
		this.RULE("sourceElement", () => {
			this.SUBRULE(this.statement);
		});
		this.RULE("statement", () => {
			this.OR([{
				ALT: () => this.SUBRULE(this.block)
			}, {
				ALT: () => this.SUBRULE(this.variableStatement)
			}, {
				ALT: () => this.SUBRULE(this.expressionStatement)
			}]);
			this.CONSUME(Semicolon);
		});
		this.RULE("block", () => {
			this.CONSUME(LeftCurlyBrace);
			this.OPTION(() => this.SUBRULE(this.statementList));
			this.CONSUME(RightCurlyBrace);
		});
		this.RULE("statementList", () => {
			this.AT_LEAST_ONE(() => this.SUBRULE(this.statementListItem));
		});
		this.RULE("statementListItem", () => {
			/* TODO: Declarations */
			this.SUBRULE(this.statement);
		});
		this.RULE("variableStatement", () => {
			this.CONSUME(Let);
			this.SUBRULE(this.variableDeclarationList);
			/* Deviation from the standard, no semicolon */
		});
		this.RULE("variableDeclarationList", () => {
			this.SUBRULE(this.variableDeclaration);
			this.MANY(() => {
				this.CONSUME(Comma);
				this.SUBRULE2(this.variableDeclaration);
			});
		});
		this.RULE("variableDeclaration", () => {
			/* TODO: Add BindingPattern */
			this.OR([{
				ALT: () => {
					this.SUBRULE(this.bindingIdentifier);
					this.OPTION(() => this.SUBRULE(this.initializer));
				}
			}]);
		});
		this.RULE("initializer", () => {
			this.CONSUME(Equals);
			this.SUBRULE(this.assignmentExpression);
		});
		this.RULE("assignmentExpression", () => {
			/* TODO: More possibilities */
			this.OR([{
				ALT: () => this.SUBRULE(this.arrowFunction)
			}, {
				ALT: () => this.SUBRULE(this.conditionalExpression)
			}]);
		});
		this.RULE("conditionalExpression", () => {
			/* TODO: Ternary */
			this.OR([{
				ALT: () => this.SUBRULE(this.logicalOrExpression)
			}]);
		});
		this.RULE("logicalOrExpression", () => {
			this.SUBRULE(this.logicalAndExpression);
			this.MANY(() => {
				this.CONSUME(OrOperator);
				this.SUBRULE2(this.logicalAndExpression);
			});
		});
		this.RULE("logicalAndExpression", () => {
			this.SUBRULE(this.bitwiseOrExpression);
			this.MANY(() => {
				this.CONSUME(AndOperator);
				this.SUBRULE2(this.bitwiseOrExpression);
			});
		});
		this.RULE("bitwiseOrExpression", () => {
			this.SUBRULE(this.bitwiseXorExpression);
			this.MANY(() => {
				this.CONSUME(BitwiseOrOperator);
				this.SUBRULE2(this.bitwiseXorExpression);
			});
		});
		this.RULE("bitwiseXorExpression", () => {
			this.SUBRULE(this.bitwiseAndExpression);
			this.MANY(() => {
				this.CONSUME(BitwiseXorOperator);
				this.SUBRULE2(this.bitwiseAndExpression);
			});
		});
		this.RULE("bitwiseAndExpression", () => {
			this.SUBRULE(this.equalityExpression);
			this.MANY(() => {
				this.CONSUME(BitwiseAndOperator);
				this.SUBRULE2(this.equalityExpression);
			});
		});
		this.RULE("equalityExpression", () => {
			this.SUBRULE(this.relationalExpression);
		});
		this.RULE("relationalExpression", () => {
			this.SUBRULE(this.shiftExpression);
		});
		this.RULE("shiftExpression", () => {
			this.SUBRULE(this.additiveExpression);
		});
		this.RULE("additiveExpression", () => {
			this.SUBRULE(this.multiplicativeExpression);
			this.MANY(() => {
				this.CONSUME(AdditiveOperator);
				this.SUBRULE2(this.multiplicativeExpression);
			});
		});
		this.RULE("multiplicativeExpression", () => {
			this.SUBRULE(this.exponentiationExpression);
			this.MANY(() => {
				this.CONSUME(MultiplicativeOperator);
				this.SUBRULE2(this.exponentiationExpression);
			});
		});
		this.RULE("exponentiationExpression", () => {
			this.SUBRULE(this.unaryExpression);
			this.MANY(() => {
				this.CONSUME(ExponentiationOperator);
				this.SUBRULE2(this.unaryExpression);
			});
		});
		this.RULE("unaryExpression", () => {
			this.SUBRULE(this.updateExpression);
		});
		this.RULE("updateExpression", () => {
			this.SUBRULE(this.leftHandSideExpression);
		});
		this.RULE("leftHandSideExpression", () => {
			this.SUBRULE(this.memberExpression);
			this.OPTION(() => this.SUBRULE(this.arguments));
			// this.OR([{
			// 	ALT: () => this.SUBRULE(this.newExpression)
			// }, {
			// 	ALT: () => this.SUBRULE(this.callExpression)
			// }]);
		});
		/* `newExpression` and `callExpression` are removed,
		* since both essentially start with `memberExpression`.
		* This is covered by changing `leftHandSideExpression` accordingly.
		*/
		// this.RULE("newExpression", () => {
		// 	this.SUBRULE(this.memberExpression);
		// });
		// this.RULE("callExpression", () => {
		// 	/* TODO: More cases */
		// 	this.OR([{
		// 		ALT: () => {
		// 			this.SUBRULE(this.memberExpression);
		// 			this.SUBRULE(this.arguments);
		// 		}
		// 	}]);
		// });
		this.RULE("memberExpression", () => {
			this.SUBRULE(this.primaryExpression);
		});
		this.RULE("arguments", () => {
			this.CONSUME(LeftParenthesis);
			this.OPTION(() => this.SUBRULE(this.argumentList));
			this.CONSUME(RightParenthesis);
		});
		this.RULE("argumentList", () => {
			/* TODO: Rest */
			this.SUBRULE(this.assignmentExpression);
			this.MANY(() => {
				this.CONSUME(Comma);
				this.SUBRULE2(this.assignmentExpression);
			});
		});
		this.RULE("primaryExpression", () => {
			this.OR([{
				ALT: () => this.SUBRULE(this.literal)
			}, {
				ALT: () => this.SUBRULE(this.identifierReference)
			}, {
				GATE: () => {
					const nextToken1 = input[this.inputIdx + 1];
					const nextToken2 = input[this.inputIdx + 2];
					/* TODO: Add more gates */
					if (tokenMatcher(nextToken1, LeftCurlyBrace)) {
						return false;
					}
					if (
						tokenMatcher(nextToken1, Let) &&
						tokenMatcher(nextToken2, LeftSquareBracket)
					) {
						return false;
					}
					return true;
				},
				ALT: () => {
					this.CONSUME(LeftParenthesis);
					this.SUBRULE(this.expression);
					this.CONSUME(RightParenthesis);
				}
			}]);
		});
		this.RULE("identifierReference", () => {
			this.CONSUME(Identifier);
		});
		this.RULE("expression", () => {
			this.AT_LEAST_ONE(() => this.SUBRULE(this.assignmentExpression));
		});
		this.RULE("literal", () => {
			this.OR([{
				ALT: () => this.SUBRULE(this.numericLiteral)
			}, {
				ALT: () => this.SUBRULE(this.boolLiteral)
			}, {
				ALT: () => this.SUBRULE(this.stringLiteral)
			}]);
		});
		this.RULE("numericLiteral", () => {
			this.CONSUME(NumberLiteral);
		});
		this.RULE("boolLiteral", () => {
			this.CONSUME(BoolLiteral);
		});
		this.RULE("stringLiteral", () => {
			this.CONSUME(StringLiteral);
		});
		this.RULE("arrowFunction", () => {
			this.SUBRULE(this.arrowParameters);
			this.CONSUME(FatArrow);
			this.SUBRULE(this.conciseBody);
		});
		this.RULE("arrowParameters", () => {
			this.OR([{
				ALT: () => this.SUBRULE(this.bindingIdentifier)
			}, {
				ALT: () => this.SUBRULE(this.coverParenthesizedExpressionAndArrowParameterList)
			}]);
		});
		this.RULE("conciseBody", () => {
			this.OR([{
				GATE: () => {
					const nextToken1 = input[this.inputIdx + 1];
					if (tokenMatcher(nextToken1, LeftCurlyBrace)) {
						return false;
					}
					return true;
				},
				ALT: () => this.SUBRULE(this.assignmentExpression)
			}, {
				ALT: () => {
					this.CONSUME(LeftCurlyBrace);
					this.SUBRULE(this.functionBody);
					this.CONSUME(RightCurlyBrace);
				}
			}]);
		});
		this.RULE("bindingIdentifier", () => {
			/* TODO: yield, await, IdentifierName */
			this.CONSUME(Identifier);
		});
		this.RULE("coverParenthesizedExpressionAndArrowParameterList", () => {
			this.CONSUME(LeftParenthesis);
			// /* Deviation from the standard! */
			// /* TODO: rest parameters */
			this.OPTION(() => {
				this.SUBRULE(this.bindingIdentifier);
				this.MANY(() => {
					this.CONSUME(Comma);
					this.SUBRULE2(this.bindingIdentifier);
				});
			});
			this.CONSUME(RightParenthesis);
		});
		this.RULE("functionBody", () => {
			this.SUBRULE(this.functionStatementList);
		});
		this.RULE("functionStatementList", () => {
			this.OPTION(() => {
				this.SUBRULE(this.statementList);
			});
		});
		this.RULE("expressionStatement", () => {
			/* TODO: More gates */
			this.OR([{
				GATE: () => {
					const nextToken1 = input[this.inputIdx + 1];
					if (tokenMatcher(nextToken1, LeftCurlyBrace)) {
						return false;
					}
					return true;
				},
				ALT: () => this.SUBRULE(this.expression)
			}]);
		});
		Parser.performSelfAnalysis(this);
	}
}
/**
* Recursively transforms a CST to an AST
* @param {object} cst
*	A concrete syntax tree
* @returns {object}
*	An abstract syntax tree
*/
export function transform(cst) {
	const { children } = cst;
	console.log(cst.name);
	switch (cst.name) {
		case "program": {
			const { sourceElements } = children;
			const elements = sourceElements.map(transform);
			return new Program(null, ...elements);
		}
		case "sourceElements": {
			const { sourceElement } = children;
			return sourceElement.map(transform);
		}
		case "sourceElement": {
			const { statement: [statement] } = children;
			return transform(statement);
		}
		case "statement": {
			const { block, variableStatement, expressionStatement } = children;
			for (const item of [block, variableStatement, expressionStatement]) {
				if (item.length) {
					const [value] = item;
					return transform(value);
				}
			}
		}
		case "block": {
			const { statementList } = children;
			const statements = statementList.map(transform);
			return new Block(null, ...statements);
		}
		case "statementList": {
			const { statementListItem } = children;
			return statementListItem.map(transform);
		}
		case "statementListItem": {
			const { statement, declaration } = children;
			for (const item of [statement, declaration]) {
				if (item.length) {
					const [value] = item;
					return transform(value);
				}
			}
		}
		case "variableStatement": {
			const { variableDeclarationList } = children;
			const [list] = variableDeclarationList.map(transform);
			return new LetStatement(null, list);
		}
		case "variableDeclarationList": {
			const { variableDeclaration } = children;
			return variableDeclaration.map(transform);
		}
		case "variableDeclaration": {
			const { bindingIdentifier, initializer } = children;
			const [id] = bindingIdentifier.map(transform);
			const [value] = initializer.map(transform);
			return [id, value];
		}
		case "bindingIdentifier": {
			const { Identifier: [identifier] } = children
			const id = new Id(getLocation(identifier), identifier.image);
			return id;
		}
		case "initializer": {
			const { assignmentExpression } = children;
			const [value] = assignmentExpression.map(transform);
			return value;
		}
		case "assignmentExpression": {
			const { conditionalExpression, arrowFunction } = children;
			for (const item of [conditionalExpression, arrowFunction]) {
				if (item.length) {
					const [value] = item;
					return transform(value);
				}
			}
		}
		case "conditionalExpression": {
			const { logicalOrExpression } = children;
			const [value] = logicalOrExpression.map(transform);
			return value;
		}
		case "logicalOrExpression": {
			const { logicalAndExpression } = children;
			const [lhs, ...rhs] = logicalAndExpression.map(transform);
			return !rhs.length ? lhs : [lhs, ...rhs].reduce((r1, r2) => {
				const { start } = r1.location;
				const { end } = r2.location;
				const location = {
					start,
					end
				};
				return new LogicalOr(location, r1, r2);
			});
		}
		case "logicalAndExpression": {
			const { bitwiseOrExpression } = children;
			const [lhs, ...rhs] = bitwiseOrExpression.map(transform);
			return !rhs.length ? lhs : [lhs, ...rhs].reduce((r1, r2) => {
				const { start } = r1.location;
				const { end } = r2.location;
				const location = {
					start,
					end
				};
				return new LogicalAnd(location, r1, r2);
			});
		}
		case "bitwiseOrExpression": {
			const { bitwiseXorExpression } = children;
			const [lhs, ...rhs] = bitwiseXorExpression.map(transform);
			return !rhs.length ? lhs : [lhs, ...rhs].reduce((r1, r2) => {
				const { start } = r1.location;
				const { end } = r2.location;
				const location = {
					start,
					end
				};
				return new BitwiseOr(location, r1, r2);
			});
		}
		case "bitwiseXorExpression": {
			const { bitwiseAndExpression } = children;
			const [lhs, ...rhs] = bitwiseAndExpression.map(transform);
			return !rhs.length ? lhs : [lhs, ...rhs].reduce((r1, r2) => {
				const { start } = r1.location;
				const { end } = r2.location;
				const location = {
					start,
					end
				};
				return new BitwiseXor(location, r1, r2);
			});
		}
		case "bitwiseAndExpression": {
			const { equalityExpression } = children;
			const [lhs, ...rhs] = equalityExpression.map(transform);
			return !rhs.length ? lhs : [lhs, ...rhs].reduce((r1, r2) => {
				const { start } = r1.location;
				const { end } = r2.location;
				const location = {
					start,
					end
				};
				return new BitwiseAnd(location, r1, r2);
			});
		}
		case "equalityExpression": {
			const { relationalExpression } = children;
			const [value] = relationalExpression.map(transform);
			return value;
		}
		case "relationalExpression": {
			const { shiftExpression } = children;
			const [value] = shiftExpression.map(transform);
			return value;
		}
		case "shiftExpression": {
			const { additiveExpression } = children;
			const [value] = additiveExpression.map(transform);
			return value;
		}
		case "additiveExpression": {
			const { multiplicativeExpression, AdditiveOperator: operators } = children;
			const [lhs, ...rhs] = multiplicativeExpression.map(transform);
			return [lhs, ...rhs].reduce((r1, r2, i) => {
				const operator = operators[i - 1];
				const { start } = r1.location;
				const { end } = r2.location;
				const location = {
					start,
					end
				};
				if (tokenMatcher(operator, Plus)) {
					return new Add(location, r1, r2);
				}
				else {
					return new Subtract(location, r1, r2);
				}
			});
		}
		case "multiplicativeExpression": {
			const { exponentiationExpression, MultiplicativeOperator: operators } = children;
			const [lhs, ...rhs] = exponentiationExpression.map(transform);
			return [lhs, ...rhs].reduce((r1, r2, i) => {
				const operator = operators[i - 1];
				const { start } = r1.location;
				const { end } = r2.location;
				const location = {
					start,
					end
				};
				if (tokenMatcher(operator, Asterisk)) {
					return new Multiply(location, r1, r2);
				}
				else if (tokenMatcher(operator, Slash)) {
					return new Divide(location, r1, r2);
				}
				else if (tokenMatcher(operator, ModuloOperator)) {
					return new ModuloExpression(location, r1, r2);
				}
				else if (tokenMatcher(operator, RemainderOperator)) {
					return new RemainderExpression(location, r1, r2);
				}
			});
		}
		case "exponentiationExpression": {
			const { unaryExpression } = children;
			const [lhs, ...rhs] = unaryExpression.map(transform);
			return [lhs, ...rhs].reduceRight((right, left) => {
				const { start } = left.location;
				const { end } = right.location;
				const location = {
					start,
					end
				};
				return new Power(location, left, right);
			});
		}
		case "unaryExpression": {
			const { updateExpression } = children;
			const [value] = updateExpression.map(transform);
			return value;
		}
		case "updateExpression": {
			const { leftHandSideExpression } = children;
			const [value] = leftHandSideExpression.map(transform);
			return value;
		}
		case "leftHandSideExpression": {
			const { memberExpression: [member], arguments: [args] } = children;
			if (args) {
				return new Apply(null, transform(member), ...transform(args));
			}
			else {
				return transform(member);
			}
		}
		case "arguments": {
			const { argumentList: [list] } = children;
			return transform(list);
		}
		case "argumentList": {
			const { assignmentExpression } = children;
			return assignmentExpression.map(transform);
		}
		case "newExpression": {
			const { memberExpression } = children;
			const [value] = memberExpression.map(transform);
			return value;
		}
		case "memberExpression": {
			const { primaryExpression } = children;
			const [value] = primaryExpression.map(transform);
			return value;
		}
		case "primaryExpression": {
			const { literal, expression, identifierReference } = children;
			for (const item of [literal, expression, identifierReference]) {
				if (item.length) {
					const [value] = item;
					return transform(value);
				}
			}
		}
		case "identifierReference": {
			const { Identifier: [identifier] } = children
			const id = new Id(getLocation(identifier), identifier.image);
			return id;
		}
		case "literal": {
			const { numericLiteral, boolLiteral, stringLiteral } = children;
			for (const item of [numericLiteral, boolLiteral, stringLiteral]) {
				if (item.length) {
					const [value] = item;
					return transform(value);
				}
			}
		}
		case "numericLiteral": {
			const { NumberLiteral: [number] } = children;
			const conversion = Number(number.image);
			return new Int32Value(getLocation(number), new Int32Array([conversion]));
		}
		case "boolLiteral": {
			const { BoolLiteral: [bool] } = children;
			return new BoolValue(getLocation(bool), bool.image === "true");
		}
		case "stringLiteral": {
			const { StringLiteral: [string] } = children;
			const conversion = String(
				string
				.image
				.replace(/^"|"$/g, "")
				.replace(/\\"/g, `"`)
			);
			return new StringValue(getLocation(string), conversion);
		}
		case "expression": {
			const { assignmentExpression } = children;
			const [value] = assignmentExpression.map(transform);
			return value;
		}
		case "assignmentExpression": {
			const { conditionalExpression, arrowFunction } = children;
			for (const item of [conditionalExpression, arrowFunction]) {
				if (item.length) {
					const [value] = item;
					return transform(value);
				}
			}
		}
		case "arrowFunction": {
			const { arrowParameters, conciseBody: [conciseBody] } = children;
			const formalParameters = arrowParameters.map(transform);
			const body = transform(conciseBody);
			return new FunctionExpression(null, formalParameters, body);
		}
		case "arrowParameters": {
			const { bindingIdentifier, coverParenthesizedExpressionAndArrowParameterList } = children;
			for (const item of [bindingIdentifier, coverParenthesizedExpressionAndArrowParameterList]) {
				if (item.length) {
					const [value] = item;
					return transform(value);
				}
			}
		}
		case "coverParenthesizedExpressionAndArrowParameterList": {
			const { bindingIdentifier } = children;
			return bindingIdentifier.map(transform);
		}
		case "conciseBody": {
			const { assignmentExpression, functionBody } = children;
			for (const item of [assignmentExpression, functionBody]) {
				if (item.length) {
					const [value] = item;
					const transformation = transform(value);
					if (Array.isArray(transformation)) {
						return transformation;
					}
					else {
						return [transformation];
					}
				}
			}
		}
		case "functionBody": {
			const { functionStatementList: [functionStatementList] } = children;
			return transform(functionStatementList);
		}
		case "functionStatementList": {
			const { statementList: [statementList] } = children;
			return transform(statementList);
		}
		case "expressionStatement": {
			const { expression } = children;
			const [value] = expression;
			return transform(value);
		}
		default: {
			throw new Error(`CST transformation not implemented for CST node "${cst.name}"`);
		}
	}
}