import type { Codegen } from "@/codegen";
import ts from "typescript";

export function visitFunctionDeclaration(codegen: Codegen, node: ts.FunctionDeclaration): void {
  // only for inlined functions
  codegen.createFunctionLabel(node);
}