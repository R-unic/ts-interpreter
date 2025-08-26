import ts from "typescript";
import assert from "assert";
import path from "path";

import { Codegen } from "./codegen";

const filePath = process.argv[2];
assert(filePath, "Invalid file path");

const program = ts.createProgram({
  rootNames: [path.resolve(filePath)],
  options: { strict: true }
});

const codegen = new Codegen(program, 8);
const file = program.getSourceFile(filePath);
assert(file, `Could not find source file ${filePath}`)

const bytecode = codegen.generate(file);
console.log(bytecode);