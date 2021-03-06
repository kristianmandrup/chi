import {
	Int8Type,
	Int16Type,
	Int32Type,
	StringType,
	BoolType
} from "./Types";
export const LEFT = Symbol("Left-associative");
export const RIGHT = Symbol("Right-associative");
export class Environment extends Map {
	set(name, location) {
		super.set(name, location);
		return location;
	}
}
export class Store extends Map {
	static location = 0;
	at(location) {
		return this.get(location);
	}
	set(location, value) {
		super.set(location, value);
		return location;
	}
	get nextLocation() {
		return Store.location++;
	}
}
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
		super(location);
		this.value = content;
	}
}
export class Expression extends Locatable {}
export class Value extends Locatable {
	constructor(location, primitive) {
		super(location);
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
	constructor(location, identifier, expression) {
		super(location);
		this.identifier = identifier;
		this.expression = expression;
	}
}
export class FunctionExpression extends Expression {
	constructor(location, parameters, body) {
		super(location);
		this.parameters = parameters;
		this.body = body;
	}
}
export class Apply extends Expression {
	constructor(location, target, ...args) {
		super(location);
		this.target = target;
		this.args = args;
	}
}
export class Id extends Expression {
	constructor(location, name, typeHint = null) {
		super(location);
		this.name = name;
		this.typeHint = typeHint;
	}
}
export class Cast extends Locatable {
	constructor(location, target, to) {
		super(location);
		this.target = target;
		this.to = to;
	}
}
export class NumberValue extends Value {}
export class IntValue extends NumberValue {
	get number() {
		return this.value[0];
	}
	to(type) {
		if (type === Int8Type) {
			return new Int8Value(null, Int8Array.from(this.value));
		}
		else if (type === Int16Type) {
			return new Int16Value(null, Int16Array.from(this.value));
		}
		else if (type === Int32Type) {
			return new Int32Value(null, Int32Array.from(this.value));
		}
		else {
			throw new Error(`Cast not impemented: ${type}`);
		}
	}
	static add(left, right) {
		return this.compute(left, right, (x, y) => x.number + y.number);
	}
	static subtract(left, right) {
		return this.compute(left, right, (x, y) => x.number - y.number);
	}
	static multiply(left, right) {
		return this.compute(left, right, (x, y) => x.number * y.number);
	}
	static divide(left, right) {
		return this.compute(left, right, (x, y) => x.number / y.number);
	}
	static power(left, right) {
		return this.compute(left, right, (x, y) => x.number ** y.number);
	}
	inspect() {
		let hint;
		if (this instanceof Int8Value) {
			hint = "8";
		}
		else if (this instanceof Int16Value) {
			hint = "16";
		}
		else if (this instanceof Int32Value) {
			hint = "32";
		}
		return `${this.value[0]}:i${hint}`;
	}
	toString() {
		return this.inspect();
	}
}
export class Int8Value extends IntValue {
	static compute(left, right, f) {
		left.to(Int8Type);
		right.to(Int8Type);
		return new Int8Value(null, Int8Array.from([f(left, right)]));
	}
}
export class Int16Value extends IntValue {
	static compute(left, right, f) {
		left.to(Int16Type);
		right.to(Int16Type);
		return new Int16Value(null, Int16Array.from([f(left, right)]));
	}
}
export class Int32Value extends IntValue {
	static compute(left, right, f) {
		left.to(Int32Type);
		right.to(Int32Type);
		return new Int32Value(null, Int32Array.from([f(left, right)]));
	}
}
export class StringValue extends Value {
	to(type) {
		if (type === StringType) {
			return this;
		}
		else {
			throw new TypeError(`Can't cast string "${this.value}" to anything but strings`);
		}
	}
	concatenate(string) {
		return new StringValue(null, this.value + string.value);
	}
	inspect() {
		return `"${this.value}"`;
	}
	toString() {
		return this.inspect();
	}
}
export class BoolValue extends Value {
	to(type) {
		if (type === BoolType) {
			return this;
		}
		else {
			throw new TypeError(`Can't cast boolean "${this.value}" to anything but bools`);
		}
	}
	inspect() {
		return this.value;
	}
	toString() {
		return this.inspect();
	}
}
export class ClosureValue extends Value {
	constructor(parameters, body, environment) {
		super(null);
		this.parameters = parameters;
		this.body = body;
		this.environment = environment;
	}
	inspect() {
		const parameters = this.parameters.map(p => p.name);
		return `Closure(${parameters.join(", ")}):(${this.typeHint})`;
	}
	toString() {
		return this.inspect();
	}
}