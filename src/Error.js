import Error from "es6-error";
export class ReferenceError extends Error {
	constructor(reference, message = `Reference error: Identifier "${reference}" is not defined`) {
		super(message);
		this.reference = reference;
	}
}