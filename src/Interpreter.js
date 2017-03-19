import { debug } from "print-log";
import {
	Environment,
	Store,
	Value,
	Operator,
	BinaryOperator,
	UnaryOperator,
	Add,
	Subtract,
	Multiply,
	Divide,
	Power,
	Let,
	Int8Value,
	Int16Value,
	Int32Value,
	ClosureValue,
	BoolValue,
	Block,
	Id,
	FunctionExpression,
	Apply,
	And,
	Or,
	Not,
	Cast
} from "./InterpreterClasses";
import {
	IntType,
	Int8Type,
	Int16Type,
	Int32Type,
	StringType
} from "./Types";
export default function interpret(expression, environment = new Environment(), store = new Store()) {
	const π = (expression, env = environment, s = store) => interpret(expression, env, s);
	if (expression instanceof Value) {
		return [expression, store];
	}
	else if (expression instanceof Block) {
		const { content } = expression;
		let result, s = store;
		for (const expression of content) {
			const [value, newStore] = π(expression, environment, s);
			result = value;
			s = newStore;
		}
		return [result, s];
	}
	else if (expression instanceof Operator) {
		if (expression instanceof BinaryOperator) {
			const [left, s1] = π(expression.left);
			const [right, s2] = π(expression.right, environment, s1);
			const { typeHint } = expression;
			if (expression instanceof And) {
				return [new BoolValue(null, left.value && right.value), s2];
			}
			else if (expression instanceof Or) {
				return [new BoolValue(null, left.value || right.value), s2];
			}
			else if (expression instanceof Add) {
				if (IntType.isPrototypeOf(typeHint)) {
					if (typeHint === Int8Type) {
						return [Int8Value.add(left, right), s2];
					}
					else if (typeHint === Int16Type) {
						return [Int16Value.add(left, right), s2];
					}
					else if (typeHint === Int32Type) {
						return [Int32Value.add(left, right), s2];
					}
				}
				else if (typeHint === StringType) {
					return [left.concatenate(right), s2];
				}
			}
			else if (expression instanceof Subtract) {
				if (typeHint === Int8Type) {
					return [Int8Value.subtract(left, right), s2];
				}
				else if (typeHint === Int16Type) {
					return [Int16Value.subtract(left, right), s2];
				}
				else if (typeHint === Int32Type) {
					return [Int32Value.subtract(left, right), s2];
				}
			}
			else if (expression instanceof Multiply) {
				if (typeHint === Int8Type) {
					return [Int8Value.multiply(left, right), s2];
				}
				else if (typeHint === Int16Type) {
					return [Int16Value.multiply(left, right), s2];
				}
				else if (typeHint === Int32Type) {
					return [Int32Value.multiply(left, right), s2];
				}
			}
			else if (expression instanceof Divide) {
				if (typeHint === Int8Type) {
					return [Int8Value.divide(left, right), s2];
				}
				else if (typeHint === Int16Type) {
					return [Int16Value.divide(left, right), s2];
				}
				else if (typeHint === Int32Type) {
					return [Int32Value.divide(left, right), s2];
				}
			}
			else if (expression instanceof Power) {
				if (typeHint === Int8Type) {
					return [Int8Value.power(left, right), s2];
				}
				else if (typeHint === Int16Type) {
					return [Int16Value.power(left, right), s2];
				}
				else if (typeHint === Int32Type) {
					return [Int32Value.power(left, right), s2];
				}
			}
		}
		else if (expression instanceof UnaryOperator) {
			if (expression instanceof Not) {
				const [result, s1] = π(expression.operand);
				return [new BoolValue(null, !result.value), s1];
			}
		}
	}
	else if (expression instanceof FunctionExpression) {
		const { parameters, body, typeHint } = expression;
		const closure = new ClosureValue(parameters, body, environment);
		closure.typeHint = typeHint;
		return [closure, store];
	}
	else if (expression instanceof Apply) {
		const { target, args, typeHint } = expression;
		const [closure, funStore] = π(target);
		let argStore = funStore;
		/* Evaluate the argument list first */
		const argMap = new Map();
		for (const arg of args) {
			const [argV, newArgStore] = π(arg, environment, argStore);
			argStore = newArgStore;
			argMap.set(arg, argV);
		}
		const { parameters, body, environment: closureEnvironment } = closure;
		/* Extend the environment and the store */
		const newEnvironment = new Environment(closureEnvironment);
		/* This happens before any binding occurs. If the current environment already contains a binding for a certain name, but the parameters use the same name, too, we must remove the environment binding in the new environment first. */
		for (const { name } of parameters) {
			if (newEnvironment.has(name)) {
				newEnvironment.delete(name);
			}
		}
		const getBindings = () => {
			return parameters
				.map(p => ({
					[p.name]: newEnvironment.has(p.name)
				}))
				.reduce((x, y) => Object.assign(x, y), {});
		};
		/* First, bind all parameters to the arguments */
		for (let i = 0; i < args.length; ++i) {
			const arg = args[i];
			const parameter = parameters[i];
			/* Get the specified argument */
			const value = argMap.get(arg);
			/* Set up new environment, bind parameter to argument value */
			const newLocation = store.nextLocation;
			newEnvironment.set(parameter.name, newLocation);
			argStore.set(newLocation, value);
		}
		if (args.length < parameters.length) {
			/* Underspecified: Return a new closure */
			const bindings = getBindings();
			const closure = new ClosureValue(parameters.filter(p => !bindings[p.name]), body, newEnvironment);
			/* Forward the expression's type hint to the closure (TODO: This is a a dummy value, fix this) */
			closure.typeHint = typeHint;
			return [closure, argStore];
		}
		else {
			/* Return the value */
			return π(body, newEnvironment, argStore);
		}
	}
	else if (expression instanceof Let) {
		const { identifier, expression: boundExpression } = expression;
		const { name } = identifier;
		const [value, s1] = π(boundExpression);
		const newStore = new Store(s1);
		const location = environment.set(name, newStore.nextLocation);
		newStore.set(location, value);
		return [value, newStore];
	}
	else if (expression instanceof Id) {
		const { name } = expression;
		const location = environment.get(name);
		return [store.get(location), store];
	}
	else if (expression instanceof Cast) {
		const { target, to: type } = expression;
		const [value, s1] = π(target);
		if (value instanceof Value) {
			return [value.to(type), s1];
		}
		else {
			throw new Error("Not implemented");
		}
	}
	else {
		debug(`"Interpreter error: ${expression.constructor.name}" not implemented:`, expression);
		throw new Error("Interpretation failed");
	}
}