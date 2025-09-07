import { Codegen } from "@/codegen";
import ts from "typescript";
import { hasModifier } from "../utility";

export function visitEnumDeclaration(codegen: Codegen, node: ts.EnumDeclaration): void {
  if (hasModifier(node, ts.SyntaxKind.ConstKeyword)) return; // do nothing for const enums

  // TODO:
}
