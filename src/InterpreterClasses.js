export const LEFT = Symbol("Left-associative");
export const RIGHT = Symbol("Right-associative");
export class Locatable {
	constructor(location = null) {
		this.location = location;
	}
}
export class Block extends Locatable {
	constructor(location, ...content) {
		super(location);
		this.content = content;
	}
}
export class Statement extends Locatable {
	constructor(location, content = null) {
		// console.log("statement content", content);
		super(location);
		this.value = content;
	}
}
export class Expression extends Locatable {}
export class Value extends Locatable {
	constructor(location, primitive) {
		super(location)
		this.value = primitive;
	}
}
export class Operator extends Expression {}
export class BinaryOperator extends Operator {
	constructor(location, left, right) {
		super(location);
		this.left = left;
		this.right = right;
	}
}
export class UnaryOperator extends Operator {
	constructor(location, operand) {
		super(location);
		this.operand = operand;
	}
}
export class And extends BinaryOperator {}
export class Or extends BinaryOperator {}
export class Not extends UnaryOperator {}
export class Add extends BinaryOperator {}
export class Subtract extends BinaryOperator {}
export class Multiply extends BinaryOperator {}
export class Divide extends BinaryOperator {}
export class Power extends BinaryOperator {}
export class Let extends Statement {
	constructor(location, name, expression) {
		super(location);
		this.name = name;
		this.expression = expression;
	}
}
export class Function extends Expression {
	constructor(location, parameters, body) {
		super(location);
		this.parameters = parameters;
		this.body = body;
	}
}
export class Apply extends Expression {
	constructor(location, target, args) {
		super(location);
		this.target = target;
		this.args = args;
	}
}
export class Id extends Expression {
	constructor(location, name) {
		super(location);
		this.name = name;
	}
}
export class Number extends Value {}
export class String extends Value {}
export class Boolean extends Value {}
export class True extends Boolean {}
export class False extends Boolean {}
export class Closure extends Value {
	constructor(parameters, body, environment, originalArity = parameters.length) {
		super(null);
		this.parameters = parameters;
		this.originalArity = originalArity;
		this.body = body;
		this.environment = environment;
	}
}