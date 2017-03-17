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
	Int8,
	Int16,
	Int32,
	Closure,
	Block,
	Id,
	FunctionExpression,
	Apply,
	True,
	False,
	And,
	Or,
	Not,
	Cast
} from "./InterpreterClasses";
import { TypeInt, TypeInt8, TypeInt16, TypeInt32, TypeString } from "./Types";
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
				let result;
				if (left instanceof False || right instanceof False) {
					result = new False();
				}
				else {
					result = new True();
				}
				return [result, s2];
			}
			else if (expression instanceof Or) {
				const [left, s1] = π(expression.left);
				const [right, s2] = π(expression.right, environment, s1);
				let result;
				if (left instanceof True || right instanceof True) {
					result = new True();
				}
				else {
					result = new False();
				}
				return [result, s2];
			}
			else if (expression instanceof Add) {
				const [left, s1] = π(expression.left);
				const [right, s2] = π(expression.right, environment, s1);
				const { typeHint } = expression;
				if (TypeInt.isPrototypeOf(typeHint)) {
					if (typeHint === TypeInt8) {
						return [Int8.add(left, right), s2];
					}
					else if (typeHint === TypeInt16) {
						return [Int16.add(left, right), s2];
					}
					else if (typeHint === TypeInt32) {
						return [Int32.add(left, right), s2];
					}
				}
				else if (typeHint === TypeString) {
					return [left.concatenate(right), s2];
				}
			}
			else if (expression instanceof Subtract) {
				const [left, s1] = π(expression.left);
				const [right, s2] = π(expression.right, environment, s1);
				const { typeHint } = expression;
				if (TypeInt.isPrototypeOf(typeHint)) {
					if (typeHint === TypeInt8) {
						return [Int8.subtract(left, right), s2];
					}
					else if (typeHint === TypeInt16) {
						return [Int16.subtract(left, right), s2];
					}
					else if (typeHint === TypeInt32) {
						return [Int32.subtract(left, right), s2];
					}
				}
				else {
					throw new TypeError();
				}
			}
			else if (expression instanceof Multiply) {
				const [left, s1] = π(expression.left);
				const [right, s2] = π(expression.right, environment, s1);
				const { typeHint } = expression;
				if (TypeInt.isPrototypeOf(typeHint)) {
					if (typeHint === TypeInt8) {
						return [Int8.multiply(left, right), s2];
					}
					else if (typeHint === TypeInt16) {
						return [Int16.multiply(left, right), s2];
					}
					else if (typeHint === TypeInt32) {
						return [Int32.multiply(left, right), s2];
					}
				}
			}
			else if (expression instanceof Divide) {
				const [left, s1] = π(expression.left);
				const [right, s2] = π(expression.right, environment, s1);
				const { typeHint } = expression;
				if (TypeInt.isPrototypeOf(typeHint)) {
					if (typeHint === TypeInt8) {
						return [Int8.divide(left, right), s2];
					}
					else if (typeHint === TypeInt16) {
						return [Int16.divide(left, right), s2];
					}
					else if (typeHint === TypeInt32) {
						return [Int32.divide(left, right), s2];
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
				const [value, s1] = π(expression.operand);
				let result;
				if (value instanceof False) {
					result = new True();
				}
				else {
					result = new False();
				}
				return [result, s1];
			}
		}
	}
	else if (expression instanceof FunctionExpression) {
		const { parameters, body } = expression;
		return [new Closure(parameters, body, environment), store];
	}
	else if (expression instanceof Apply) {
		const { target, args } = expression;
		const [funV, funStore] = π(target);
		let argStore = funStore;
		/* Evaluate the argument list first */
		const argArray = [];
		for (const arg of args) {
			const [argV, newArgStore] = π(arg, environment, argStore);
			argStore = newArgStore;
			argArray.push([arg, [argV, argStore]]);
		}
		if (!(funV instanceof Closure)) {
			throw new TypeError(`Can not invoke "${funV.value}", as it is of type "${funV.constructor.name}"`);
		}
		else {
			const { parameters, body, environment, originalArity } = funV;
			/* Extend the environment and the store */
			const newEnvironment = new Environment(environment);
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
					const closure = new Closure(parameters.filter(p => !bindings[p.name]), body, newEnvironment, originalArity);
					return [closure, argStore];
				}
				++i;
			}
			/* We have enough arguments now, so let's evaluate. */
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