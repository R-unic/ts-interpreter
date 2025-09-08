import ts, { isIdentifier } from "typescript";

import { canInlineVariable } from "../utility";
import { createStore, loadNull } from "@/bytecode/utility";
import { STORE } from "@/bytecode/instructions/store";
import type { Codegen } from "@/codegen";

export function visitVariableDeclaration(codegen: Codegen, node: ts.VariableDeclaration): void {
  if (!isIdentifier(node.name))
    throw new Error("Binding patterns not yet supported");

  if (canInlineVariable(node, codegen)) return; // don't emit variables for constants, they will be inlined
  codegen.pushInstruction(createStore(codegen, node.name.text, node.initializer));
}
