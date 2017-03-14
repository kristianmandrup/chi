export const LEFT = Symbol("Left-associative");
export const RIGHT = Symbol("Right-associative");
export class Type {}
export class TypeInt8 extends Type {}
export class TypeInt16 extends Type {}
export class TypeInt32 extends Type {}
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
export class Cast extends Locatable {
	constructor(location, target, to) {
		super(location);
		this.target = target;
		this.to = to;
	}
}
export class Number extends Value {}
export class Int extends Number {
	to(type) {
		if (type instanceof TypeInt8) {
			return new Int8(null, Int8Array.from(this.value));
		}
		else if (type instanceof TypeInt16) {
			return new Int16(null, Int16Array.from(this.value));
		}
		else if (type instanceof TypeInt32) {
			return new Int32(null, Int32Array.from(this.value));
		}
		else {
			throw new Error(`Cast not impemented: ${type}`);
		}
	}
	compute(f, x) {
		const [{ value: value1 }, { value: value2 }] = [this, x];
		f(value1, value2);
		return new this.constructor(null, value1);
	}
	add(x) {
		return this.compute((a, b) => a[0] += b[0], x);
	}
	subtract(x) {
		return this.compute((a, b) => a[0] -= b[0], x);
	}
	multiply(x) {
		return this.compute((a, b) => a[0] *= b[0], x);
	}
	divide(x) {
		return this.compute((a, b) => a[0] /= b[0], x);
	}
	inspect() {
		let hint;
		if (this instanceof Int8) {
			hint = "8";
		}
		else if (this instanceof Int16) {
			hint = "16";
		}
		else if (this instanceof Int32) {
			hint = "32";
		}
		return `${this.value[0]}:i${hint}`;
	}
}
export class Int8 extends Int {}
export class Int16 extends Int {}
export class Int32 extends Int {}
export class String extends Value {
	concatenate(string) {
		return new String(null, this.value + string.value);
	}
}
export class Boolean extends Value {
	inspect() {
		if (this instanceof True) {
			return "true";
		}
		else if (this instanceof False) {
			return "false";
		}
		else {
			throw new Error("Tried to inspect generic boolean");
		}
	}
}
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