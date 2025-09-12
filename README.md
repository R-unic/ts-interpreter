# ts-interpreter

Experimental bytecode interpreter for TypeScript which targets the [Ryde VM](https://github.com/R-unic/ryde)

## Basic Example

```ts
console.log("Hello, world!")
```

Emitted bytecode:

```c
0:  PRINTK  String("Hello, world!")
1:  HALT
```

## Real Examples

Check out [the examples directory](https://github.com/R-unic/ts-interpreter/tree/master/example), any code there is currently supported by the codegen

## Will not be implemented

* `null`
* Most standard library functionality
