import ts from "typescript";

import { getTargetRegister } from "@/bytecode/utility";
import { InstructionOp } from "@/bytecode/structs";
import { binaryInstruction } from "@/bytecode/instructions/binary";
import type { Codegen } from "@/codegen";

const OPERATOR_OPCODE_MAP: Partial<Record<ts.BinaryOperator, InstructionOp>> = {
  [ts.SyntaxKind.PlusToken]: InstructionOp.ADD,
  [ts.SyntaxKind.MinusToken]: InstructionOp.SUB,
  [ts.SyntaxKind.AsteriskToken]: InstructionOp.MUL,
  [ts.SyntaxKind.SlashToken]: InstructionOp.DIV,
  [ts.SyntaxKind.PercentToken]: InstructionOp.MOD,
  [ts.SyntaxKind.AsteriskAsteriskToken]: InstructionOp.POW
};

export function visitBinaryExpression(codegen: Codegen, node: ts.BinaryExpression): void {
  const left = codegen.visit(node.left);
  const right = codegen.visit(node.right);
  const leftRegister = getTargetRegister(left);
  const rightRegister = getTargetRegister(right);
  switch (node.operatorToken.kind) {
    case ts.SyntaxKind.EqualsToken: {

      break;
    }

    default: {
      const op = OPERATOR_OPCODE_MAP[node.operatorToken.kind];
      if (op === undefined)
        throw new Error(`Unsupported binary operator ${ts.SyntaxKind[node.operatorToken.kind]}`);

      // replace the left register value with the result
      codegen.pushInstruction(binaryInstruction(op, leftRegister, leftRegister, rightRegister));
      break;
    }
  }

  // free the right value (we don't need it anymore)
  codegen.freeRegister(rightRegister);
}