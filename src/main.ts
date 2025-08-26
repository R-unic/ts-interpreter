import ts from "typescript";
import assert from "assert";
import path from "path";

import { Codegen } from "./codegen";
import { serializeProgram } from "./bytecode/serialization/program";
import { writeFileSync } from "fs";

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
const buf = serializeProgram(bytecode);
console.log(bytecode);
console.log(buf);
writeFileSync("../../rust/ryde/out.bin", buf);