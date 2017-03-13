# chi
<p align="center">
  <img alt="logo" src="https://cloud.githubusercontent.com/assets/4442505/23861497/8546651a-080a-11e7-86a2-57a2baa1e56a.png">
</p>
In order to try it out, run:
```bash
$ npm i
$ npm run all
```
This will tokenize the file `src/example.chi` and then parse and interpret it.
**Please do not use chi in production yet. It's still highly experimental and will likely change a lot.**
## About chi
Chi, in its current form, is a meant to be a dynamically-typed, imperative programming language featuring ideas from the functional programming paradigm. As such, it considers functions to be first-class and performs automatic currying. It uses static scope and supports Unicode tokens. A (potentially incomplete) showcase of features is listed in the next section.
## Getting started
### Variables
Bindings allow you to bind a value to a name. Note that there is no significant whitespace and semicolons are *optional*.
```js
let a = 3;
let b = 5
```
### Function expressions
Function expressions allow you to abstract your code over variables. Note that in chi, you don't need an explicit `return` statement, as blocks evaluate to their last expression. So, in the example, `sum1` and `sum2` are semantically equivalent.
```js
let identity = x => x
let identity2 = (x) => x
let sum1 = (a, b) => a + b
let sum2 = (a, b) => {
	let sum = a + b
	sum
}
```
### Automatic currying
In chi, you *don't* need to explicitly return a lambda function that closes over a certain environment. Instead, if whatever a function returns doesn't have enough parameters bound in the environment, it becomes a closure. This means, `curry1` (which either returns a *closure* for *one* argument, or a *value* for *two* arguments) and `curry2` (which behaves exactly the same) can be used *interchangeably*.
```js
let curry1 = x => y => x + y
let curry2 = (x, y) => x + y
curry1(5, 8)
curry2(5, 8)
curry1(5)(8)
curry2(5)(8)
```
### Arity checking
If you try to invoke a function with more arguments than it can receive, chi will refuse to invoke it and instead throw a `BindError`.
```js
let f = (x, y) = x * y - 3
f(1, 2, 3)
```
### Unicode tokens
Chi also allows certain tokens to have alternative forms. For example, the `MINUS` token can either be `Hyphen-minus`, `En Dash` or `Em Dash` (`-`, `–` and `—` respectively). Further examples how this can benefit esthetics can be seen below.
```js
let y = (x, y) => 2¹⁰ · x² – y⁴
let bool = true ∧ false ∨ true
```
