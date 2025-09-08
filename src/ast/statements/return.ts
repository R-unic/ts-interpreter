import ts from "typescript";

import { loadNull } from "@/bytecode/utility";
import { RETURN } from "@/bytecode/instructions/return";
import type { Codegen } from "@/codegen";
import { JMP } from "@/bytecode/instructions/jmp";

function findFunctionLikeAncestor(node: ts.Node): ts.SignatureDeclaration | undefined {
  const parent = node.parent;
  if (!parent) return;

  if (ts.isFunctionLike(parent))
    return parent;

  return findFunctionLikeAncestor(parent);
}

export function visitReturnStatement(codegen: Codegen, node: ts.ReturnStatement): void {
  const functionDeclaration = findFunctionLikeAncestor(node);
  if (!functionDeclaration)
    throw new Error("Failed to find return statement's function declaration");

  const symbol = functionDeclaration.name !== undefined
    ? codegen.getSymbol(functionDeclaration.name) ?? codegen.getSymbol(functionDeclaration)
    : codegen.getSymbol(functionDeclaration);

  if (!symbol)
    throw new Error("Failed to find return statement's function symbol");

  const label = codegen.getFunctionLabel(symbol);
  if (label && label.inlined) {
    const instruction = JMP(-1);
    codegen.toPatch.inlineReturns.add(instruction);
    return void codegen.pushInstruction(instruction);
  }

  let register: number;
  if (node.expression) {
    const instruction = codegen.visit(node.expression);
    register = codegen.getTargetRegister(instruction);
  } else {
    register = codegen.allocRegister();
    codegen.pushInstruction(loadNull(register));
  }

  codegen.pushInstruction(RETURN);
  codegen.freeRegister(register);
}