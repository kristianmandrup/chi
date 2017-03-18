import { debug, err, warn } from "print-log";
import { ReferenceError } from "./Error";
import {
	Block,
	Let,
	Id,
	Operator,
	BinaryOperator,
	UnaryOperator,
	Add,
	Subtract,
	Multiply,
	Divide,
	And,
	Or,
	Not,
	Environment,
	Store,
	Value,
	NumberValue,
	IntValue,
	Int8Value,
	Int16Value,
	Int32Value,
	StringValue,
	BoolValue,
	FunctionExpression,
	Apply,
	Cast
} from "./InterpreterClasses";
import {
	IntType,
	Int8Type,
	Int16Type,
	Int32Type,
	StringType,
	BoolType,
	FunctionType,
	VoidType,
	RecursiveType,
	AnyType
} from "./Types";
import * as lexerImports from "./Lexer";
import { Type as TypeToken } from "./Lexer";
const types = Object.values(lexerImports).filter(x => TypeToken.isPrototypeOf(x));
const infer = (expression, type) => {
	if (expression.typeHint) {
		warn(`Overwriting type hint ${expression.typeHint} of ${expression} with ${type}`);
	}
	expression.typeHint = type;
};
function toKeyword(type) {
	return types
		.find(x => x.TYPE === type)
		.PATTERN
		.toString()
		.replace(/^\/|\/$/g, "");
}
export function getGreaterDomain(left, right) {
	const leftInt8 = left === Int8Type;
	const rightInt8 = right === Int8Type;
	const leftInt16 = left === Int16Type;
	const rightInt16 = right === Int16Type;
	const leftInt32 = left === Int32Type;
	const rightInt32 = right === Int32Type;
	/* Casting Int8 */
	if (leftInt8 && rightInt8) {
		return left;
	}
	else if (leftInt8 && !rightInt8) {
		return right;
	}
	else if (!leftInt8 && rightInt8) {
		return left;
	}
	/* Casting Int16 */
	else if (leftInt16 && rightInt16) {
		return left;
	}
	else if (leftInt16 && !rightInt16) {
		return right;
	}
	else if (!leftInt16 && rightInt16) {
		return left;
	}
	/* Casting Int32 */
	else if (leftInt32 && rightInt32) {
		return left;
	}
	else if (leftInt32 && !rightInt32) {
		return left;
	}
	else if (!leftInt32 && rightInt32) {
		return right;
	}
	else {
		throw new Error("Domain: Not implemented yet");
	}
}
const getTypeOf = (expression, environment = new Environment(), store = new Store()) => {
	const typeOf = (expression, env = environment, s = store) => getTypeOf(expression, env, s);
	/* TODO: RecursiveType check necessary */
	function valueMatchesType(value, type, env = environment) {
		const trivialChecks = (
			type === AnyType
			|| (
				value instanceof Int8Value && type === Int8Type
				|| value instanceof Int16Value && type === Int16Type
				|| value instanceof Int32Value && type === Int32Type
				|| value instanceof StringValue && type === StringType
				|| value instanceof BoolValue && type === BoolType
			)
		);
		if (trivialChecks) {
			return trivialChecks;
		}
		if (value instanceof FunctionExpression) {
			if (type instanceof FunctionType) {
				const { domain } = type;
				const { parameters } = value;
				const map = parameters.map((parameter, i) => {
					return valueMatchesType(parameter, domain[i], env);
				});
				err("This part hasn't been debugged yet");
				return map.every(v => v);
			}
		}
		return false;
	}
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
					infer(identifier, type);
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
					if (boundExpression instanceof FunctionExpression) {
						/* Functions may lazily refer to themselves */
						const location = environment.set(name, store.nextLocation);
						store.set(location, new RecursiveType(identifier));
						const [type, s1] = typeOf(boundExpression);
						infer(identifier, type);
						return [type, s1];
					}
					else {
						throw new ReferenceError(name, `Can not use an undeclared reference for "${name}" within its own definition`);
					}
				}
			}
			throw e;
		}
	}
	else if (expression instanceof Operator) {
		if (expression instanceof BinaryOperator) {
			if (expression instanceof And) {
				const [left, s1] = typeOf(expression.left);
				const [right, s2] = typeOf(expression.right, environment, s1);
				if (left !== BoolType || right !== BoolType) {
					throw new TypeError(`The operator "∧" is not defined for operands of type "${toKeyword(left)}" and "${toKeyword(right)}".`);
				}
				else {
					return [BoolType, s2];
				}
			}
			if (expression instanceof Or) {
				const [left, s1] = typeOf(expression.left);
				const [right, s2] = typeOf(expression.right, environment, s1);
				if (left !== BoolType || right !== BoolType) {
					throw new TypeError(`The operator "∨" is not defined for operands of type "${toKeyword(left)}" and "${toKeyword(right)}".`);
				}
				else {
					return [BoolType, s2];
				}
			}
			else if (expression instanceof Add) {
				const [left, s1] = typeOf(expression.left);
				const [right, s2] = typeOf(expression.right, environment, s1);
				if (left === StringType && right === StringType) {
					infer(expression, StringType);
					return [StringType, s2];
				}
				if (IntType.isPrototypeOf(left) && IntType.isPrototypeOf(right)) {
					const greaterDomain = getGreaterDomain(left, right);
					infer(expression, greaterDomain);
					return [greaterDomain, s2];
				}
				else {
					throw new TypeError(`The operator "+" is not defined for operands of type "${toKeyword(left)}" and "${toKeyword(right)}".`);
				}
			}
			else if (expression instanceof Subtract) {
				const [left, s1] = typeOf(expression.left);
				const [right, s2] = typeOf(expression.right, environment, s1);
				if (IntType.isPrototypeOf(left) && IntType.isPrototypeOf(right)) {
					const greaterDomain = getGreaterDomain(left, right);
					infer(expression, greaterDomain);
					return [greaterDomain, s2];
				}
				else {
					throw new TypeError(`The operator "+" is not defined for operands of type "${toKeyword(left)}" and "${toKeyword(right)}".`);
				}
			}
			else if (expression instanceof Multiply) {
				const [left, s1] = typeOf(expression.left);
				const [right, s2] = typeOf(expression.right, environment, s1);
				if (IntType.isPrototypeOf(left) && IntType.isPrototypeOf(right)) {
					const greaterDomain = getGreaterDomain(left, right);
					infer(expression, greaterDomain);
					return [greaterDomain, s2];
				}
				else {
					throw new TypeError(`The operator "+" is not defined for operands of type "${toKeyword(left)}" and "${toKeyword(right)}".`);
				}
			}
			else if (expression instanceof Divide) {
				const [left, s1] = typeOf(expression.left);
				const [right, s2] = typeOf(expression.right, environment, s1);
				if (IntType.isPrototypeOf(left) && IntType.isPrototypeOf(right)) {
					const greaterDomain = getGreaterDomain(left, right);
					infer(expression, greaterDomain);
					return [greaterDomain, s2];
				}
				else {
					throw new TypeError(`The operator "+" is not defined for operands of type "${toKeyword(left)}" and "${toKeyword(right)}".`);
				}
			}
		}
		if (expression instanceof UnaryOperator) {
			if (expression instanceof Not) {
				const [operandType, s1] = typeOf(expression.operand);
				if (operandType !== BoolType) {
					throw new TypeError(`The operator "¬" is not defined for operands of type "${toKeyword(operandType)}".`);
				}
				else {
					return [BoolType, s1];
				}
			}
		}
	}
	else if (expression instanceof Value) {
		if (expression instanceof NumberValue) {
			if (expression instanceof IntValue) {
				if (expression instanceof Int8Value) {
					return [Int8Type, store];
				}
				if (expression instanceof Int16Value) {
					return [Int16Type, store];
				}
				if (expression instanceof Int32Value) {
					return [Int32Type, store];
				}
			}
		}
		if (expression instanceof StringValue) {
			return [StringType, store];
		}
		if (expression instanceof BoolValue) {
			return [BoolType, store];
		}
	}
	if (expression instanceof FunctionExpression) {
		const { parameters, body } = expression;
		let domain;
		if (!parameters.length) {
			domain = [VoidType];
		}
		else {
			domain = parameters.map(() => AnyType);
		}
		const newEnv = new Environment(environment);
		for (const { name } of parameters) {
			const location = newEnv.set(name, store.nextLocation);
			store.set(location, AnyType);
		}
		const [image] = typeOf(body, newEnv);
		const type = new FunctionType(domain, image);
		infer(expression, type);
		return [type, store];
	}
	else if (expression instanceof Apply) {
		const { target, args } = expression;
		const [type, s1] = typeOf(target);
		function checkArguments(domain, image) {
			let currentStore = s1;
			args.forEach((arg, i) => {
				const [argumentType, s2] = typeOf(arg, environment, currentStore);
				let expectedType = domain[i];
				if (!expectedType) {
					/* Parameter must be somewhere in image! */
					let node = type;
					let currentIndex = 0;
					while (true) {
						const { domain, image } = node;
						if (domain) {
							/* Can we even find the index in this node? */
							if (i > currentIndex + domain.length - 1) {
								/* No, go to next node */
								currentIndex += domain.length;
								node = image;
								continue;
							}
							else {
								expectedType = domain[currentIndex - i];
								break;
							}
						}
						else {
							throw new Error(`More arguments specified than formal parameters available in invocation of ${target.name ? `"${target.name}"` : "closure"}`);
						}
					}
				}
				currentStore = s2;
				if (valueMatchesType(arg, expectedType, environment)) {
					infer(arg, argumentType);
				}
				else {
					throw new TypeError(`Argument "${arg}" of type "${toKeyword(argumentType)}" doesn't match expected type "${toKeyword(expectedType)}"`);
				}
			});
			if (args.length < domain.length) {
				const restDomain = domain.slice(args.length);
				const type = new FunctionType(restDomain, image);
				infer(expression, type);
				return [type, currentStore];
			}
			else {
				infer(expression, image);
				return [image, currentStore];
			}
		}
		if (type instanceof FunctionType) {
			const { domain, image } = type;
			const isVoidFunction = domain.length === 1 && domain[0] === VoidType;
			if (!args.length) {
				if (isVoidFunction) {
					infer(expression, image);
					return [image, s1];
				}
				else {
					throw new TypeError(`Tried to invoke ${target.name ? `"${target.name}"` : "closure"} without any arguments`);
				}
			}
			else {
				if (isVoidFunction) {
					const [actualType] = typeOf(target);
					throw new TypeError(`Tried to pass ${args.length} more argument${args.length === 1 ? "" : "s"} to ${target.name ? `"${target.name}"` : "closure"} of type "${actualType}" although none were expected`);
				}
				else {
					return checkArguments(domain, image);
				}
			}
		}
		else if (type instanceof RecursiveType) {
			if ((target instanceof Apply)) {
				throw new Error("Not implemented");
				// return [resultType, s1];
			}
			else {
				const { typeHint } = type.identifier;
				const resultType = typeHint.image;
				const [newType, newStore] = checkArguments(typeHint.domain, typeHint.image);
				if (!expression.typeHint) {
					/* TODO: Can this happen? */
					warn("Yes, it can happen!");
					infer(expression, resultType);
				}
				return [newType, newStore];
			}
		}
		else {
			throw new TypeError(`Unable to invoke ${target.name ? `"${target.name}"` : "intermediate value"}, as it is of type "${toKeyword(type)}".`);
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
			if (IntType.isPrototypeOf(type) && IntType.isPrototypeOf(targetType)) {
				/* Allow dynamic casting for integers */
				return [type, s1];
			}
			else {
				throw new TypeError(`Can not cast "${toKeyword(targetType)}" to "${toKeyword(type)}"`);
			}
		}
	}
	err(expression);
	throw new TypeError(`Unable to determine type of ${expression}`);
};
export default getTypeOf;