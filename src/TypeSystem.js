import {
	Value,
	Number,
	Environment,
	Store,
	Int8,
	Int16,
	Int32,
	String
} from "./InterpreterClasses";
export class Type {}
export class TypeInt8 extends Type {}
export class TypeInt16 extends Type {}
export class TypeInt32 extends Type {}
export class TypeString extends Type {}
const getTypeOf = (expression, environment = new Environment(), store = new Store()) => {
	const typeOf = (expression, env = environment, s = store) => getTypeOf(expression, env, s);
	if (expression instanceof Value) {
		if (expression instanceof Number) {
			if (expression instanceof Int) {
				if (expression instanceof Int8) {
					return TypeInt8;
				}
				if (expression instanceof Int16) {
					return TypeInt16;
				}
				if (expression instanceof Int32) {
					return TypeIn32;
				}
			}
		}
		if (expression instanceof String) {
			return TypeString;
		}
	}
	throw new TypeError(`Unable to determine type of ${expression}`);
}
export default getTypeOf;