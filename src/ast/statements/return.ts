import ts, { findAncestor, isFunctionLike } from "typescript";

import { loadNull } from "@/bytecode/utility";
import { RETURN } from "@/bytecode/instructions/return";
import { JMP } from "@/bytecode/instructions/jmp";
import type { Codegen } from "@/codegen";

export function visitReturnStatement(codegen: Codegen, node: ts.ReturnStatement): void {
  const functionDeclaration = findAncestor(node, isFunctionLike);
  if (!functionDeclaration)
    throw new Error("Failed to find return statement's function declaration");

  const symbol = functionDeclaration.name !== undefined
    ? codegen.getSymbol(functionDeclaration.name) ?? codegen.getSymbol(functionDeclaration)
    : codegen.getSymbol(functionDeclaration);

  if (!symbol)
    throw new Error("Failed to find return statement's function symbol");

  let register: number;
  if (node.expression) {
    const instruction = codegen.visit(node.expression);
    register = codegen.getTargetRegister(instruction);
  } else {
    register = codegen.allocRegister();
    codegen.pushInstruction(loadNull(register));
  }

  const label = codegen.getFunctionLabel(symbol);
  if (!label)
    throw new Error("No function label found to return from");

  if (label.inlined) {
    const returnJump = JMP(-1);
    label.inlineReturns.add(returnJump);
    codegen.freeRegister(register);
    codegen.closestFreeRegister = register;
    codegen.pushInstruction(returnJump);
  } else {
    label.returnRegisters.push(register);
    codegen.pushInstruction(RETURN);
  }
}