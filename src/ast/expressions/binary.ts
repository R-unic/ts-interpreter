import ts, { isIdentifier } from "typescript";

import { getTargetRegister } from "@/bytecode/utility";
import { InstructionOp } from "@/bytecode/structs";
import { binaryInstruction } from "@/bytecode/instructions/binary";
import { STORE } from "@/bytecode/instructions/store";
import type { Codegen } from "@/codegen";
import assert from "assert";

const OPERATOR_OPCODE_MAP: Partial<Record<ts.BinaryOperator, InstructionOp>> = {
  [ts.SyntaxKind.PlusToken]: InstructionOp.ADD,
  [ts.SyntaxKind.MinusToken]: InstructionOp.SUB,
  [ts.SyntaxKind.AsteriskToken]: InstructionOp.MUL,
  [ts.SyntaxKind.SlashToken]: InstructionOp.DIV,
  [ts.SyntaxKind.PercentToken]: InstructionOp.MOD,
  [ts.SyntaxKind.AsteriskAsteriskToken]: InstructionOp.POW,
  [ts.SyntaxKind.LessThanToken]: InstructionOp.LT,
  [ts.SyntaxKind.LessThanEqualsToken]: InstructionOp.LTE,
  [ts.SyntaxKind.GreaterThanToken]: InstructionOp.GT,
  [ts.SyntaxKind.GreaterThanEqualsToken]: InstructionOp.GTE,
  [ts.SyntaxKind.EqualsEqualsToken]: InstructionOp.EQ,
  [ts.SyntaxKind.ExclamationEqualsEqualsToken]: InstructionOp.NEQ,
};

export function visitBinaryExpression(codegen: Codegen, node: ts.BinaryExpression): void {
  let rightRegister: number;
  switch (node.operatorToken.kind) {
    case ts.SyntaxKind.EqualsToken: {
      assert(isIdentifier(node.left), "Binding patterns not yet supported");

      const right = codegen.visit(node.right);
      rightRegister = getTargetRegister(right);
      codegen.pushInstruction(STORE(rightRegister, node.left.text));
      break;
    }

    default: {
      const op = OPERATOR_OPCODE_MAP[node.operatorToken.kind];
      if (op === undefined)
        throw new Error(`Unsupported binary operator ${ts.SyntaxKind[node.operatorToken.kind]}`);

      // replace the left register value with the result
      const left = codegen.visit(node.left);
      const leftRegister = getTargetRegister(left);
      const right = codegen.visit(node.right);
      rightRegister = getTargetRegister(right);
      codegen.pushInstruction(binaryInstruction(op, leftRegister, leftRegister, rightRegister));
      break;
    }
  }

  // free the right value (we don't need it anymore)
  codegen.freeRegister(rightRegister);
}