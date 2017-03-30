import { Lexer, Token } from "chevrotain";
import { err } from "print-log";
import {
	Int8Type as i8,
	Int16Type as i16,
	Int32Type as i32,
	StringType as string,
	BoolType as bool,
	RecursiveType as infinity
} from "./Types";
const { SKIPPED, NA } = Lexer;
export class Identifier extends Token {
	static PATTERN = /[a-zA-Z]\w*/;
}
export class Colon extends Token {
	static PATTERN = /:/;
}
export class AdditiveOperator extends Token {
	static PATTERN = NA;
}
export class MultiplicativeOperator extends Token {
	static PATTERN = NA;
}
export class Comma extends Token {
	static PATTERN = /,/;
}
export class BitwiseOrOperator extends Token {
	static PATTERN = /\|/;
}
export class BitwiseXorOperator extends Token {
	static PATTERN = /\^/;
}
export class BitwiseAndOperator extends Token {
	static PATTERN = /&/;
}
export class Plus extends AdditiveOperator {
	static PATTERN = /\+/;
}
export class Minus extends AdditiveOperator {
	static PATTERN = /-|–|—/;
}
export class ExponentiationOperator extends Token {
	static PATTERN = /\*\*/;
}
export class Asterisk extends MultiplicativeOperator {
	static PATTERN = /\*|·|×/;
}
export class Slash extends MultiplicativeOperator {
	static PATTERN = /\//;
}
export class RemainderOperator extends MultiplicativeOperator {
	static PATTERN = /%/;
}
export class ModuloOperator extends MultiplicativeOperator {
	static PATTERN = /mod/;
}
export class AndOperator extends Token {
	static PATTERN = /&&|∧/;
}
export class OrOperator extends Token {
	static PATTERN = /\|\||∨/;
}
export class NotOperator extends Token {
	static PATTERN = /¬|!/;
}
export class PowerLiteral extends Token {
	static PATTERN = /[⁰¹²³⁴⁵⁶⁷⁸⁹]+/;
}
export class LeftCurlyBrace extends Token {
	static PATTERN = /{/;
}
export class RightCurlyBrace extends Token {
	static PATTERN = /}/;
}
export class LeftParenthesis extends Token {
	static PATTERN = /\(/;
}
export class RightParenthesis extends Token {
	static PATTERN = /\)/;
}
export class LeftSquareBracket extends Token {
	static PATTERN = /\[/;
}
export class RightSquareBracket extends Token {
	static PATTERN = /\]/;
}
export class Literal extends Token {
	static PATTERN = NA;
}
export class BoolLiteral extends Literal {
	static PATTERN = NA;
}
export class TrueLiteral extends BoolLiteral {
	static PATTERN = /true/;
}
export class FalseLiteral extends BoolLiteral {
	static PATTERN = /false/;
}
export class NumberLiteral extends Literal {
	static PATTERN = /\d+/;
}
export class StringLiteral extends Literal {
	static PATTERN = /([\"])(?:\\\1|.)*?\1/;
}
export class Semicolon extends Token {
	static PATTERN = /;/;
}
export class Equals extends Token {
	static PATTERN = /=/;
}
export class FatArrow extends Token {
	static PATTERN = /=>/;
}
export class Keyword extends Token {
	static PATTERN = NA;
	static LONGER_ALT = Identifier;
}
export class While extends Keyword {
	static PATTERN = /while/;
}
export class For extends Keyword {
	static PATTERN = /for/;
}
export class Do extends Keyword {
	static PATTERN = /do/;
}
export class Let extends Keyword {
	static PATTERN = /let/;
}
export class If extends Keyword {
	static PATTERN = /if/;
}
export class Else extends Keyword {
	static PATTERN = /else/;
}
export class Type extends Keyword {
	static PATTERN = NA;
}
export class TypeBool extends Type {
	static PATTERN = /bool/;
	static TYPE = bool;
}
export class TypeInt8 extends Type {
	static PATTERN = /i8/;
	static TYPE = i8;
}
export class TypeInt16 extends Type {
	static PATTERN = /i16/;
	static TYPE = i16;
}
export class TypeInt32 extends Type {
	static PATTERN = /i32/;
	static TYPE = i32;
}
export class TypeString extends Type {
	static PATTERN = /string/;
	static TYPE = string;
}
export class TypeRecursive extends Type {
	static PATTERN = /infinity/;
	static TYPE = infinity;
}
export class Whitespace extends Token {
	static PATTERN = /\s+/;
	static GROUP = SKIPPED;
}
export const allTokens = [
	Whitespace,
	LeftCurlyBrace,
	RightCurlyBrace,
	LeftParenthesis,
	RightParenthesis,
	LeftSquareBracket,
	RightSquareBracket,
	Literal,
	BoolLiteral,
	BitwiseOrOperator,
	BitwiseXorOperator,
	BitwiseAndOperator,
	AndOperator,
	OrOperator,
	NotOperator,
	TrueLiteral,
	FalseLiteral,
	NumberLiteral,
	StringLiteral,
	PowerLiteral,
	ExponentiationOperator,
	AdditiveOperator,
	Plus,
	Minus,
	MultiplicativeOperator,
	Asterisk,
	Slash,
	RemainderOperator,
	ModuloOperator,
	Semicolon,
	Colon,
	FatArrow,
	Comma,
	Equals,
	Keyword,
	If,
	Else,
	While,
	For,
	Do,
	Let,
	Type,
	TypeInt8,
	TypeInt16,
	TypeInt32,
	TypeString,
	TypeBool,
	TypeRecursive,
	Identifier
];
export default class {
	internalLexer = new Lexer(allTokens);
	tokenize(string) {
		const result = this.internalLexer.tokenize(string);
		if (result.errors.length) {
			err("Lex errors detected: ", result.errors);
			throw new Error(result.errors);
		}
		return result;
	}
}