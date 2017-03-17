import { Parser } from "chevrotain";
import {
	allTokens,
	Let,
	Identifier,
	Equals,
	NumberLiteral,
	StringLiteral,
	PowerLiteral,
	BooleanLiteral,
	TrueLiteral,
	AndOperator,
	OrOperator,
	NotOperator,
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
	FatArrow,
	Comma,
	Colon,
	Type
} from "./Lexer";
import {
	Number,
	StringValue,
	Int32Value,
	TrueValue,
	FalseValue,
	Let as LetStatement,
	And,
	Or,
	Not,
	Id,
	Block,
	Add,
	Subtract,
	Multiply,
	Divide,
	Power,
	FunctionExpression,
	Apply,
	Cast
} from "./InterpreterClasses";
function parseSuperScript(value) {
	const superscripts = "⁰¹²³⁴⁵⁶⁷⁸⁹";
	return Number.parseInt(Array.from(value).map(c => String(superscripts.indexOf(c))).join(""));
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
			const and = this.SUBRULE(this.AndExpression);
			const invocationArgs = this.MANY(() => {
				this.CONSUME(LeftParenthesis);
				const args = this.OPTION2(() => {
					const firstExpression = this.SUBRULE2(this.AndExpression);
					const restExpressions = this.MANY2(() => {
						this.CONSUME(Comma);
						return this.SUBRULE3(this.AndExpression);
					});
					return [firstExpression, ...(restExpressions || [])];
				});
				this.CONSUME(RightParenthesis);
				return args || [];
			});
			const apply = [and, ...invocationArgs].reduce((r1, r2) => {
				return new Apply(null, r1, r2);
			});
			return invocationArgs.length ? apply : and;
		});
		this.RULE("AndExpression", () => {
			const lhs = this.SUBRULE(this.OrExpression);
			const rhs = this.MANY(() => {
				this.CONSUME(AndOperator);
				return this.SUBRULE2(this.OrExpression);
			});
			if (!rhs.length) {
				return lhs;
			}
			else {
				return [lhs, ...rhs].reduce((r1, r2) => {
					return new And(null, r1, r2);
				});
			}
		});
		this.RULE("OrExpression", () => {
			const lhs = this.SUBRULE(this.AdditiveExpression);
			const rhs = this.MANY(() => {
				this.CONSUME(OrOperator);
				return this.SUBRULE2(this.AdditiveExpression);
			});
			if (!rhs.length) {
				return lhs;
			}
			else {
				return [lhs, ...rhs].reduce((r1, r2) => {
					return new Or(null, r1, r2);
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
			});
		});
		this.RULE("MultiplicativeExpression", () => {
			const operators = [];
			const lhs = this.SUBRULE(this.NotExpression);
			const rhs = this.MANY(() => {
				operators.push(this.CONSUME(MultiplicativeOperator));
				return this.SUBRULE2(this.NotExpression);
			});
			return [lhs, ...rhs].reduce((r1, r2, i) => {
				const operator = operators[i - 1];
				if (operator instanceof Asterisk) {
					return new Multiply(null, r1, r2);
				}
				else if (operator instanceof Slash) {
					return new Divide(null, r1, r2);
				}
			});
		});
		this.RULE("NotExpression", () => {
			const operand = this.OPTION(() => {
				this.CONSUME(NotOperator);
				return this.SUBRULE(this.PowerExpression)
			});
			if (!operand) {
				return this.SUBRULE2(this.PowerExpression);
			}
			else {
				return new Not(null, operand);
			}
		});
		this.RULE("PowerExpression", () => {
			const base = this.SUBRULE(this.CastExpression);
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
		this.RULE("CastExpression", () => {
			const value = this.SUBRULE(this.TermExpression);
			const types = this.MANY(() => {
				this.CONSUME(Colon);
				return this.OR([{
					ALT: () => this.SUBRULE(this.Identifier)
				}, {
					ALT: () => {
						const type = this.SUBRULE(this.Type);
						return type.constructor.TYPE;
					}
				}]);
			});
			return [value, ...types].reduce((x, y) => {
				return new Cast(null, x, y);
			});
		});
		this.RULE("Type", () => {
			const token = this.CONSUME(Type);
			return token;
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
			const identifier = this.SUBRULE(this.Identifier);
			const typeToken = this.OPTION(() => {
				this.CONSUME(Colon);
				return this.SUBRULE(this.Type);
			});
			identifier.typeHint = typeToken && typeToken.constructor.TYPE || null;
			this.CONSUME(Equals);
			const argument = this.SUBRULE(this.Expression);
			return new LetStatement(identifier.location, identifier, argument);
		});
		this.RULE("Literal", () => {
			return this.OR([{
				ALT: () => this.SUBRULE(this.NumberLiteral)
			}, {
				ALT: () => this.SUBRULE(this.StringLiteral)
			}, {
				ALT: () => this.SUBRULE(this.BooleanLiteral)
			}, {
				ALT: () => this.SUBRULE(this.FunctionLiteral)
			}]);
		});
		this.RULE("NumberLiteral", () => {
			const number = this.CONSUME(NumberLiteral);
			const conversion = Number(number.image);
			return new Int32Value(number.meta.location, new Int32Array([conversion]));
		});
		this.RULE("StringLiteral", () => {
			const string = this.CONSUME(StringLiteral);
			const conversion = String(string
				.image
				.replace(/^"|"$/g, "")
				.replace(/\\"/g, `"`)
			);
			return new StringValue(string.meta.location, conversion);
		});
		this.RULE("BooleanLiteral", () => {
			const boolean = this.CONSUME(BooleanLiteral);
			if (boolean instanceof TrueLiteral) {
				return new TrueValue(boolean.meta.location, boolean.image);
			}
			else {
				return new FalseValue(boolean.meta.location, boolean.image);
			}
		});
		this.RULE("FunctionLiteral", () => {
			const identifiers = this.OR([{
				/* Argument list contains parentheses */
				ALT: () => {
					this.CONSUME(LeftParenthesis);
					const ids = this.OPTION(() => {
						const firstID = this.SUBRULE(this.Identifier);
						// const firstTypeHint = this.OPTION2(() => {
						// 	this.CONSUME(Colon);
						// 	return this.CONSUME(Type);
						// });
						// firstID.typeHint = firstTypeHint;
						const restIDs = this.MANY(() => {
							this.CONSUME(Comma);
							const identifier = this.SUBRULE2(this.Identifier);
							// const typeHint = this.OPTION3(() => {
							// 	this.CONSUME2(Colon);
							// 	return this.CONSUME2(Type);
							// });
							// identifier.typeHint = typeHint;
							return identifier;
						});
						return [firstID, ...restIDs];
					});
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
			return new FunctionExpression(null, identifiers, body);
		});
		Parser.performSelfAnalysis(this);
	}
}