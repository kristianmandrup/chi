import { debug } from "print-log";
import { Parser, Token } from "chevrotain";
import * as lexerImports from "./Lexer";
import {
	Let,
	Identifier,
	Equals,
	NumberLiteral,
	PowerLiteral,
	BooleanLiteral,
	Semicolon,
	Plus,
	AdditiveOperator,
	MultiplicativeOperator,
	Minus,
	Asterisk,
	Slash,
	LeftParenthesis,
	RightParenthesis,
	LeftBrace,
	RightBrace,
	LeftBracket,
	RightBracket,
	FatArrow,
	Comma
} from "./Lexer";
import {
	Number,
	Boolean,
	Let as LetStatement,
	Id,
	Block,
	Add,
	Subtract,
	Multiply,
	Divide,
	Power,
	Function,
	Apply
} from "./InterpreterClasses";
const allTokens = Object.values(lexerImports).filter(x => Token.isPrototypeOf(x));
function parseSuperScript(value) {
	const superscripts = "⁰¹²³⁴⁵⁶⁷⁸⁹";
	return global.Number.parseInt(Array.from(value).map(c => global.String(superscripts.indexOf(c))).join(""));
}
export default class ChiParser extends Parser {
	constructor(input) {
		super(input, allTokens);
		this.RULE("Block", () => {
			const statements = this.MANY(() => {
				return this.SUBRULE(this.Statement);
			});
			return new Block(null, ...statements);
		});
		this.RULE("Statement", () => {
			const value = this.OR([{
				ALT: () => this.SUBRULE(this.Expression)
			}, {
				ALT: () => this.SUBRULE(this.LetStatement)
			}]);
			this.OPTION(() => this.CONSUME(Semicolon));
			return value;
		});
		this.RULE("Expression", () => {
			const additive = this.SUBRULE(this.AdditiveExpression);
			const args = this.MANY(() => {
				this.CONSUME(LeftParenthesis);
				const args = this.OPTION2(() => {
					const firstExpression = this.SUBRULE2(this.AdditiveExpression);
					const restExpressions = this.MANY2(() => {
						this.CONSUME(Comma);
						return this.SUBRULE3(this.AdditiveExpression);
					});
					return [firstExpression, ...(restExpressions || [])];
				});
				this.CONSUME(RightParenthesis);
				return args || [];
			});
			if (!args.length) {
				return additive;
			}
			else {
				return [additive, ...args].reduce((r1, r2) => {
					return new Apply(null, r1, r2);
				});
			}
		});
		this.RULE("AdditiveExpression", () => {
			const operators = [];
			const lhs = this.SUBRULE(this.MultiplicativeExpression);
			const rhs = this.MANY(() => {
				operators.push(this.CONSUME(AdditiveOperator));
				return this.SUBRULE2(this.MultiplicativeExpression);
			});
			return [lhs, ...rhs].reduce((r1, r2, i) => {
				const operator = operators[i - 1];
				if (operator instanceof Plus) {
					return new Add(null, r1, r2);
				}
				else if (operator instanceof Minus) {
					return new Subtract(null, r1, r2);
				}
				else {
					throw new Error("Multiplicative operator must be plus or minus");
				}
			});
		});
		this.RULE("MultiplicativeExpression", () => {
			const operators = [];
			const lhs = this.SUBRULE(this.PowerExpression);
			const rhs = this.MANY(() => {
				operators.push(this.CONSUME(MultiplicativeOperator));
				return this.SUBRULE2(this.PowerExpression);
			});
			return [lhs, ...rhs].reduce((r1, r2, i) => {
				const operator = operators[i - 1];
				if (operator instanceof Asterisk) {
					return new Multiply(null, r1, r2);
				}
				else if (operator instanceof Slash) {
					return new Divide(null, r1, r2);
				}
				else {
					throw new Error("Multiplicative operator must be plus or minus");
				}
			});
		});
		this.RULE("PowerExpression", () => {
			const base = this.SUBRULE(this.TermExpression);
			const exponent = this.OPTION(() => {
				return this.SUBRULE2(this.PowerLiteral);
			});
			if (exponent) {
				return new Power(null, base, exponent);
			}
			else {
				return base;
			}
		});
		this.RULE("PowerLiteral", () => {
			const power = this.CONSUME(PowerLiteral);
			return new Number(power.meta.location, parseSuperScript(power.image));
		});
		this.RULE("TermExpression", () => {
			return this.OR([{
				ALT: () => this.SUBRULE(this.Literal)
			}, {
				ALT: () => this.SUBRULE(this.Identifier)
			}, {
				ALT: () => this.SUBRULE(this.ParenthesisExpression)
			}]);
		});
		this.RULE("Identifier", () => {
			const identifier = this.CONSUME(Identifier);
			return new Id(identifier.meta.location, identifier.image);
		});
		this.RULE("ParenthesisExpression", () => {
			this.CONSUME(LeftParenthesis);
			const expression = this.SUBRULE(this.Expression);
			this.CONSUME(RightParenthesis);
			return expression;
		});
		this.RULE("LetStatement", () => {
			this.CONSUME(Let);
			const identifier = this.CONSUME(Identifier);
			this.CONSUME(Equals);
			const number = this.SUBRULE(this.Expression);
			return new LetStatement(identifier.meta.location, identifier.image, number);
		});
		this.RULE("Literal", () => {
			return this.OR([{
				ALT: () => this.SUBRULE(this.NumberLiteral)
			}, {
				ALT: () => this.SUBRULE(this.BooleanLiteral)
			}, {
				ALT: () => this.SUBRULE(this.FunctionLiteral)
			}]);
		});
		this.RULE("NumberLiteral", () => {
			const number = this.CONSUME(NumberLiteral);
			return new Number(number.meta.location, global.Number(number.image));
		});
		this.RULE("BooleanLiteral", () => {
			const boolean = this.CONSUME(BooleanLiteral);
			return new Boolean(boolean.meta.location, boolean.image);
		});
		this.RULE("FunctionLiteral", () => {
			const identifiers = this.OR([{
				/* Argument list contains parentheses */
				ALT: () => {
					this.CONSUME(LeftParenthesis);
					const ids = this.OPTION(() => {
						const firstID = this.SUBRULE(this.Identifier);
						const restIDs = this.MANY(() => {
							this.CONSUME(Comma);
							return this.SUBRULE2(this.Identifier);
						});
						return [firstID, ...restIDs];
					});
					/* ↑ Comment out this definition of `ids` ↑ */
					/* ↓ …and then comment in the lower definition of `ids` */
// 					const ids = this.MANY_SEP(Comma, () => {
// 						return this.SUBRULE(this.Identifier);
// 					});
					this.CONSUME(RightParenthesis);
					return ids || [];
				}
			}, {
				/* Argument list is just an identifier */
				ALT: () => [this.SUBRULE3(this.Identifier)]
			}]);
			this.CONSUME(FatArrow);
			const body = this.OR2([{
				ALT: () => this.SUBRULE(this.Expression)
			}, {
				ALT: () => {
					this.CONSUME(LeftBrace);
					const block = this.SUBRULE2(this.Block);
					this.CONSUME(RightBrace);
					return block;
				}
			}]);
			return new Function(null, identifiers, body);
		});
		Parser.performSelfAnalysis(this);
	}
}