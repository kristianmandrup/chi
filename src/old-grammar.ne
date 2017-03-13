@{%
	const EQUALS = {
		literal: "="
	};
	const AND = {
		literal: "∧"
	};
	const OR = {
		literal: "∨"
	};
	const NOT = {
		literal: "¬"
	};
	const COMMA = {
		literal: ","
	};
	const LET = {
		literal: "let"
	};
	const TRUE = {
		literal: "true"
	};
	const FALSE = {
		literal: "false"
	};
	const FAT_ARROW = {
		literal: "=>"
	};
	const _ = {
		test(x) {
			return /\s*/.test(x);
		}
	};
	const __ = {
		test(x) {
			return /\s+/.test(x);
		}
	};
	const PAREN_LEFT = {
		literal: "("
	};
	const PAREN_RIGHT = {
		literal: ")"
	};
	const BRACE_LEFT = {
		literal: "{"
	};
	const BRACE_RIGHT = {
		literal: "}"
	};
	const PLUS = {
		literal: "+"
	};
	const MINUS = {
		literal: "-"
	};
	const ASTERISK = {
		literal: "*"
	};
	const SLASH = {
		literal: "/"
	};
	const SEMICOLON = {
		literal: ";"
	};
%}
Main ->
	_ Block _ {%
		(data, location) => {
			return ["Block", location, data[1]];
		}
	%}
Block ->
	# /*Statement {% data => [data[0]] %}*/
	Statement _ %SEMICOLON:? {%
		data => [data[0]]
	%}
	| %BRACE_LEFT _ Block:* _ %BRACE_RIGHT {%
		data => data[2]
	%}
	# | Statement _ ";":? {%
	#	(data, location, reject) => {
	#		return [data[0]];
	#	}
	#%}
	| Block __ Block {%
		(data, location, reject) => {
			return [...data[0], ...data[2]];
		}
	%}
	#(Statement %SEMICOLON:?):+ {%
	#	(data, location, reject) => {
	#		return data.map(block => block[0]).map(statement => statement[0]);
	#	}
	#%}
Statement ->
	Expression {% id %}
	| VariableDeclaration {% id %}
VariableDeclaration ->
	%LET __ Identifier _ %EQUALS _ Expression {%
		(data, location) => {
			return ["VariableDeclaration", location, [data[2], data[6]]];
		}
	%}
Expression ->
	TermExpression {% id %}
	| Expression _ %PLUS _ TermExpression {%
		(data, location, reject) => {
			const [lhs] = data;
			const [rhs] = data.slice(-1);
			return ["AdditionExpression", location, [lhs, rhs]];
		}
	%}
	| Expression _ %MINUS _ TermExpression {%
		(data, location, reject) => {
			const [lhs] = data;
			const [rhs] = data.slice(-1);
			return ["SubtractionExpression", location, [lhs, rhs]];
		}
	%}
	| Expression _ %ASTERISK _ TermExpression {%
		(data, location, reject) => {
			const [lhs] = data;
			const [rhs] = data.slice(-1);
			return ["MultiplicationExpression", location, [lhs, rhs]];
		}
	%}
	| Expression _ %SLASH _ TermExpression {%
		(data, location, reject) => {
			const [lhs] = data;
			const [rhs] = data.slice(-1);
			return ["DivisionExpression", location, [lhs, rhs]];
		}
	%}
	| Expression _ %AND _ TermExpression {%
		(data, location, reject) => {
			const [lhs] = data;
			const [rhs] = data.slice(-1);
			return ["AndExpression", location, [lhs, rhs]];
		}
	%}
	| Expression _ %OR _ TermExpression {%
		(data, location, reject) => {
			const [lhs] = data;
			const [rhs] = data.slice(-1);
			return ["OrExpression", location, [lhs, rhs]];
		}
	%}
	| %NOT _ Expression {%
		(data, location, reject) => {
			return ["NotExpression", location, [data[2]]];
		}
	%}
TermExpression ->
	%PAREN_LEFT Expression %PAREN_RIGHT {% data => data[1] %}
	| Identifier {% id %}
	| NumberLiteral {% id %}
	| FunctionLiteral {% id %}
	| FunctionApplication {% id %}
	| Boolean {% id %}
Boolean ->
	%TRUE {% (data, location) => ["BooleanLiteral", location, ["true"]] %}
	| %FALSE {% (data, location) => ["BooleanLiteral", location, ["false"]] %}
Identifier ->
	[a-zA-Z]:+ {%
		(data, location) => {
			const [name] = data;
			return ["Identifier", location, [name.join("")]]
		}
	%}
NumberLiteral ->
	Number {% (data, location) => ["NumberLiteral", location, [data[0]]] %}
Number ->
	IntegerLiteral
Digit ->
	[0-9] {% id %}
PositiveIntegerLiteral ->
	Digit {% id %}
	| Digit PositiveIntegerLiteral {%
		(data, location) => data[0] + data[1]
	%}
IntegerLiteral ->
	PositiveIntegerLiteral {%
		id
	%}
	| %MINUS PositiveIntegerLiteral {%
		(data, location) => data[0] + data[1]
	%}
FunctionLiteral ->
	ParameterList _ %FAT_ARROW _ Block {%
		(data, location) => {
			return ["FunctionLiteral", location, [data[0] || [], ["Block", location, data[4]]]];
		}
	%}
FunctionApplication ->
	Expression ArgumentList {%
		(data, location) => ["FunctionApplication", location, [data[0], data[1]]]
	%}
ArgumentList ->
	%PAREN_LEFT _ _ArgumentList _ %PAREN_RIGHT {%
		data => data[2]
	%}
_ArgumentList ->
	Expression
	| Expression _ %COMMA _ _ArgumentList {%
		data => [data[0], ...data[4]]
	%}
ParameterList ->
	Identifier
	| %PAREN_LEFT (_ Identifier _ %COMMA:? _):* %PAREN_RIGHT {%
		(data, location) => {
			const args = data[1];
			if (args.length) {
				return args.map(arg => arg[1]);
			}
			else {
				return [];
			}
		}
	%}
_ ->
	%_:? {% id %}
__ ->
	%__ {% id %}