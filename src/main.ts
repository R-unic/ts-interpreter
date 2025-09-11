import { writeFileSync } from "fs";
import { dirname, relative, resolve } from "path";
import ts, { createProgram, getPreEmitDiagnostics, formatDiagnosticsWithColorAndContext } from "typescript";
import assert from "assert";

import { Codegen } from "@/codegen";
import { serializeProgram } from "@/bytecode/serialization/program";
import { bytecodeToString } from "@/bytecode/utility";
import type { Bytecode } from "@/bytecode/structs";

function handleDiagnostics(program: ts.Program): boolean {
  const emitResult = program.emit();
  const allDiagnostics = getPreEmitDiagnostics(program).concat(emitResult.diagnostics)
  const diagnostics = formatDiagnosticsWithColorAndContext(allDiagnostics, {
    getCurrentDirectory: () => process.cwd(),
    getCanonicalFileName: fileName => fileName,
    getNewLine: () => "\n",
  });

  if (!diagnostics)
    return true;

  console.log(diagnostics);
  return !allDiagnostics.some(d => d.category === ts.DiagnosticCategory.Error);
}

type GenerationResult = {
  readonly ok: false;
  readonly bytecode?: undefined;
} | {
  readonly ok: true;
  readonly bytecode: Bytecode;
}

function generateBytecode(): GenerationResult {
  const filePath = relative(dirname(__dirname), resolve(process.argv[2] ?? ""));
  assert(filePath, "Empty file path");

  const program = createProgram({
    rootNames: [filePath],
    options: {
      strict: true,
      noEmit: true,
      preserveConstEnums: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      allowJs: false,
      checkJs: false
    }
  });

  const codegen = new Codegen(program, 8);
  const file = program.getSourceFile(filePath);
  assert(file, `Could not find source file ${filePath}`);

  const bytecode = codegen.emit(file);
  const ok = handleDiagnostics(program);
  return ok ? { ok, bytecode } : { ok };
}

function writeBinary(bytecode: Bytecode): void {
  const buf = serializeProgram(bytecode);
  console.log("Writing binary:", buf);
  writeFileSync("../../rust/ryde/out.bin", buf); // so we can test it in the vm immediately
}

const { ok, bytecode } = generateBytecode();
if (ok) {
  console.log("Emitted bytecode:", bytecodeToString(bytecode));
  writeBinary(bytecode);
}