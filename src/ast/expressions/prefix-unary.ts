import ts from "typescript";

import type { Codegen } from "@/codegen";
import { InstructionOp } from "@/bytecode/structs";
import { unaryInstruction } from "@/bytecode/instructions/unary";

const OPERATOR_OPCODE_MAP: Partial<Record<ts.PrefixUnaryOperator, InstructionOp>> = {
  [ts.SyntaxKind.ExclamationToken]: InstructionOp.NOT,
  [ts.SyntaxKind.MinusToken]: InstructionOp.NEGATE,
  // [ts.SyntaxKind.TildeToken]: InstructionOp.BNOT,
};

export function visitPrefixUnaryExpression(codegen: Codegen, node: ts.PrefixUnaryExpression): void {
  switch (node.operator) {
    case ts.SyntaxKind.PlusToken:
      codegen.visit(node.operand);
      break;

    default: {
      const op = OPERATOR_OPCODE_MAP[node.operator];
      if (op === undefined)
        throw new Error(`Unsupported prefix unary operator ${ts.SyntaxKind[node.operator]}`);

      // replace the operand register's value with the result
      const operand = codegen.visit(node.operand);
      const register = codegen.getTargetRegister(operand);
      codegen.pushInstruction(unaryInstruction(op, register, register))
      break;
    }
  }
}