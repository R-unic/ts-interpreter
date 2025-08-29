import type { Codegen } from "@/codegen";
import ts from "typescript";
import { canInline } from "../utility";

export function visitFunctionDeclaration(codegen: Codegen, node: ts.FunctionDeclaration): void {
  // TODO: scoping

  codegen.createFunctionLabel(node);
}