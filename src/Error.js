import Error from "es6-error";
export class ReferenceError extends Error {
	constructor(reference, message = `Reference error: Identifier "${reference}" is not defined`) {
		super(message);
		this.reference = reference;
	}
}
export class BindError extends Error {
	constructor(parameters, originalArity) {
		const tooMany = parameters.length - originalArity;
		super(`Unable to apply a parameter list consisting of "${parameters.length}" parameters to a function whose original arity was only "${originalArity}" parameters long. Remove the last ${`${tooMany === 1 ? "parameter" : `"${tooMany}" parameters`}`}.`);
	}
}