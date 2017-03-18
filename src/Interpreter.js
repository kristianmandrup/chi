import { debug } from "print-log";
import { BindError } from "./Error";
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
			if (expression instanceof And) {
				const [left, s1] = π(expression.left);
				const [right, s2] = π(expression.right, environment, s1);
				return [new BoolValue(null, left.value && right.value), s2];
			}
			else if (expression instanceof Or) {
				const [left, s1] = π(expression.left);
				const [right, s2] = π(expression.right, environment, s1);
				return [new BoolValue(null, left.value || right.value), s2];
			}
			else if (expression instanceof Add) {
				const [left, s1] = π(expression.left);
				const [right, s2] = π(expression.right, environment, s1);
				const { typeHint } = expression;
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
				const [left, s1] = π(expression.left);
				const [right, s2] = π(expression.right, environment, s1);
				const { typeHint } = expression;
				if (IntType.isPrototypeOf(typeHint)) {
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
			}
			else if (expression instanceof Multiply) {
				const [left, s1] = π(expression.left);
				const [right, s2] = π(expression.right, environment, s1);
				const { typeHint } = expression;
				if (IntType.isPrototypeOf(typeHint)) {
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
			}
			else if (expression instanceof Divide) {
				const [left, s1] = π(expression.left);
				const [right, s2] = π(expression.right, environment, s1);
				const { typeHint } = expression;
				if (IntType.isPrototypeOf(typeHint)) {
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
			}
			else if (expression instanceof Power) {
				// const [left, s1] = π(expression.left);
				// const [right, s2] = π(expression.right, environment, s1);
				// const [{ value: leftValue }, { value: rightValue }] = [left, right];
				// return [new Number(null, leftValue ** rightValue), s2];
				throw new Error("Not implemented");
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
		const argArray = [];
		for (const arg of args) {
			const [argV, newArgStore] = π(arg, environment, argStore);
			argStore = newArgStore;
			argArray.push([arg, [argV, argStore]]);
		}
		const { parameters, body, environment: closureEnvironment, originalArity } = closure;
		/* Extend the environment and the store */
		const newEnvironment = new Environment(closureEnvironment);
		const getBindings = () => {
			return parameters
				.map(p => ({
					[p.name]: newEnvironment.has(p.name)
				}))
				.reduce((x, y) => Object.assign(x, y), {});
		};
		const isAllBound = () => {
			const allBound = Object.values(getBindings()).every(p => p);
			/* Let's just return a new closure! */
			return allBound;
		};
		let i = 0;
		for (const parameter of parameters) {
			const { name } = parameter;
			const newLocation = store.nextLocation;
			const [, [value]] = argArray[i];
			newEnvironment.set(name, newLocation);
			argStore.set(newLocation, value);
			const isLastFormalParameter = i === originalArity - 1;
			const isLastProvidedParameter = i === args.length - 1;
			if (isLastFormalParameter && !isLastProvidedParameter) {
				/* The user called this function with too many parameters */
				throw new BindError(args, originalArity);
			}
			else if (!isLastFormalParameter && isLastProvidedParameter && !isAllBound()) {
				/*
				* Note that `isLastFormalParameter` and `i` don't play nice together.
				* We must use `isAllBound` above to check if the entire context is bound.
				* We don't have enough arguments to evaluate; let's just return a new closure.
				*/
				const bindings = getBindings();
				const closure = new ClosureValue(parameters.filter(p => !bindings[p.name]), body, newEnvironment, originalArity);
				closure.typeHint = typeHint;
				return [closure, argStore];
			}
			++i;
		}
		/* We have enough arguments now, so let's evaluate. */
		return π(body, newEnvironment, argStore);
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