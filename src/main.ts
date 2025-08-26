import { createProgram } from "typescript";
import { writeFileSync } from "fs";
import { resolve } from "path";
import assert from "assert";

import { Codegen } from "./codegen";
import { serializeProgram } from "./bytecode/serialization/program";

const filePath = process.argv[2];
assert(filePath, "Empty file path");

const program = createProgram({
  rootNames: [resolve(filePath)],
  options: { strict: true }
});

const codegen = new Codegen(program, 8);
const file = program.getSourceFile(filePath);
assert(file, `Could not find source file ${filePath}`);

const bytecode = codegen.generate(file);
const buf = serializeProgram(bytecode);
console.log(bytecode);
console.log(buf);
writeFileSync("../../rust/ryde/out.bin", buf); // so we can test it in the vm immediately