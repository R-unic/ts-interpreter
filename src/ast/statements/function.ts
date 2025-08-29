import type { Codegen } from "@/codegen";
import ts from "typescript";
import { canInline } from "../utility";

export function visitFunctionDeclaration(codegen: Codegen, node: ts.FunctionDeclaration): void {
  // TODO: scoping

  if (canInline(node, codegen)) {
    codegen.createFunctionLabel(node); // only for inlined functions
  } else {
    throw new Error("Non-inlined functions are not yet implemented");
  }
}