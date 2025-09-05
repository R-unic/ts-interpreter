import { Codegen } from "@/codegen";
import ts from "typescript";

export function visitEnumDeclaration(codegen: Codegen, node: ts.EnumDeclaration): void {
  if (node.modifiers && node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ConstKeyword))
    return; // do nothing for const enums

  // TODO:
}