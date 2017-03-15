import { debug, err } from "print-log";
import { ReferenceError } from "./Error";
import {
	Block,
	Let,
	Id,
	Add,
	Value,
	Number,
	Environment,
	Store,
	Int8,
	Int16,
	Int32,
	String,
	Boolean,
	Cast
} from "./InterpreterClasses";
import {
	Type,
	TypeInt,
	TypeInt8,
	TypeInt16,
	TypeInt32,
	TypeString,
	TypeBool
} from "./Types";
import * as lexerImports from "./Lexer";
import { Type as TypeToken } from "./Lexer";
const types = Object.values(lexerImports).filter(x => TypeToken.isPrototypeOf(x));
function toKeyword(type) {
	return types
		.find(x => x.TYPE === type)
		.PATTERN
		.toString()
		.replace(/^\/|\/$/g, "");
}
const getTypeOf = (expression, environment = new Environment(), store = new Store()) => {
	const typeOf = (expression, env = environment, s = store) => getTypeOf(expression, env, s);
	if (expression instanceof Block) {
		const { content } = expression;
		let result, s = store;
		for (const expression of content) {
			const [type, newStore] = typeOf(expression, environment, s);
			result = type;
			s = newStore;
		}
		return [result, s];
	}
	else if (expression instanceof Let) {
		const { identifier, expression: boundExpression } = expression;
		const { name } = identifier;
		const { typeHint } = identifier;
		try {
			const [type, s1] = typeOf(boundExpression);
			if (typeHint && type !== typeHint) {
				throw new TypeError(`Tried to declare "${identifier.name}" with type "${toKeyword(typeHint)}", but bound to a value of type "${toKeyword(type)}"`);
			}
			else {
				if (!identifier.typeHint) {
					identifier.typeHint = type;
				}
				const newStore = new Store(s1);
				const location = environment.set(name, newStore.nextLocation);
				newStore.set(location, type);
				return [type, newStore];
			}
		}
		catch (e) {
			if (e instanceof ReferenceError) {
				/* Did the user try to use a reference to the same variable? */
				if (e.reference === name) {
					throw new ReferenceError(name, `Can not use an undeclared reference for "${name}" within its own definition`);
				}
			}
			throw e;
		}
	}
	else if (expression instanceof Add) {
		const [left, s1] = typeOf(expression.left);
		const [right, s2] = typeOf(expression.right, environment, s1);
		if (left === TypeString && right === TypeString) {
			return [TypeString, s2];
		}
		if (TypeInt.isPrototypeOf(leftType) && TypeInt.isPrototypeOf(rightType)) {
			const leftInt8 = left === TypeInt8;
			const rightInt8 = right === TypeInt8;
			const leftInt16 = left === TypeInt16;
			const rightInt16 = right === TypeInt16;
			const leftInt32 = left === TypeInt32;
			const rightInt32 = right === TypeInt32;
			/* Casting Int8 */
			if (leftInt8 && rightInt8) {
				return [leftType, s2];
			}
			else if (leftInt8 && !rightInt8) {
				return [rightType, s2];
			}
			else if (!leftInt8 && rightInt8) {
				return [leftType, s2];
			}
			/* Casting Int16 */
			else if (leftInt16 && rightInt16) {
				return [typeType, s2];
			}
			else if (leftInt16 && !rightInt16) {
				return [rightType, s2];
			}
			else if (!leftInt16 && rightInt16) {
				return [leftType, s2];
			}
			/* Casting Int32 */
			else if (leftInt32 && rightInt32) {
				return [leftType, s2];
			}
			else if (leftInt32 && !rightInt32) {
				return [leftType, s2];
			}
			else if (!leftInt32 && rightInt32) {
				return [rightType, s2];
			}
			else {
				throw new Error("Add: Not implemented yet");
			}
		}
		else {
			throw new TypeError(`The operator "+" can only be used for two strings or two numbers.`);
		}
	}
	else if (expression instanceof Value) {
		if (expression instanceof Number) {
			if (expression instanceof Int) {
				if (expression instanceof Int8) {
					return [TypeInt8, store];
				}
				if (expression instanceof Int16) {
					return [TypeInt16, store];
				}
				if (expression instanceof Int32) {
					return [TypeInt32, store];
				}
			}
		}
		if (expression instanceof String) {
			return [TypeString, store];
		}
		if (expression instanceof Boolean) {
			return [TypeBool, store];
		}
	}
	else if (expression instanceof Id) {
		const { name } = expression;
		if (!environment.has(name)) {
			throw new ReferenceError(name);
		}
		else {
			const location = environment.get(name);
			return [store.get(location), store];
		}
	}
	else if (expression instanceof Cast) {
		const { target, to: type } = expression;
		const [targetType, s1] = typeOf(target);
		if (type === targetType) {
			return [type, s1];
		}
		else {
			throw new Error("Not implemented");
		}
	}
	err(expression);
	throw new TypeError(`Unable to determine type of ${expression}`);
}
export default getTypeOf;