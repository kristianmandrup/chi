export class Type {}
export class TypeAny extends Type {}
export class TypeFunction extends TypeAny {
	constructor(domain, image) {
		super();
		this.domain = domain;
		this.image = image;
	}
}
export class TypeInt extends TypeAny {}
export class TypeInt8 extends TypeInt {}
export class TypeInt16 extends TypeInt {}
export class TypeInt32 extends TypeInt {}
export class TypeString extends TypeAny {}
export class TypeBool extends TypeAny {}
export class TypeNone {}