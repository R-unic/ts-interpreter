import ts, { isIdentifier, isStringLiteral } from "typescript";
import assert from "assert";

import { hasModifier } from "../utility";
import { STOREK } from "@/bytecode/instructions/storek";
import { type VmValue, VmValueKind, constantVmValue, vmValue } from "@/bytecode/vm-value";
import type { Codegen } from "@/codegen";

export function visitEnumDeclaration(codegen: Codegen, node: ts.EnumDeclaration): void {
  if (hasModifier(node, ts.SyntaxKind.ConstKeyword)) return; // do nothing for const enums

  const entries: [VmValue, VmValue][] = node.members.flatMap(member => {
    assert(isIdentifier(member.name) || isStringLiteral(member.name), "Unsupported enum declartion key type: " + ts.SyntaxKind[member.kind]);

    const type = codegen.getType(member.name);
    assert(type !== undefined && (type.isNumberLiteral() || type.isStringLiteral()), "wth?? no enum member type??");

    const key = vmValue(VmValueKind.String, member.name.text);
    const value = constantVmValue(type.value);
    return [[key, value], [value, key]];
  });

  const object = vmValue(VmValueKind.Object, new Map(entries));
  codegen.pushInstruction(STOREK(node.name.text, object));
}