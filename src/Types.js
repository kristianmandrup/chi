export class Type {}
export class AnyType extends Type {}
export class FunctionType extends AnyType {
	constructor(domain, image) {
		super();
		this.domain = domain;
		this.image = image;
	}
}
export class IntType extends AnyType {}
export class Int8Type extends IntType {}
export class Int16Type extends IntType {}
export class Int32Type extends IntType {}
export class StringType extends AnyType {}
export class BoolType extends AnyType {}
export class NoneType {}