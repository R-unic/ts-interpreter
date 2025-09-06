import ts, { isElementAccessExpression, isIdentifier, isPropertyAccessExpression } from "typescript";
import assert from "assert";

import { InstructionOp } from "@/bytecode/structs";
import { binaryInstruction } from "@/bytecode/instructions/binary";
import { isLOADV } from "@/bytecode/instructions/loadv";
import { STORE } from "@/bytecode/instructions/store";
import { STORE_INDEX } from "@/bytecode/instructions/store-index";
import type { Codegen } from "@/codegen";
import { STORE_INDEXK } from "@/bytecode/instructions/store-indexk";
import { constantVmValue, VmValueKind } from "@/bytecode/vm-value";

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
  // [ts.SyntaxKind.EqualsEqualsToken]: InstructionOp.EQ,
  [ts.SyntaxKind.EqualsEqualsEqualsToken]: InstructionOp.EQ,
  [ts.SyntaxKind.ExclamationEqualsEqualsToken]: InstructionOp.NEQ,
};

export function visitBinaryExpression(codegen: Codegen, node: ts.BinaryExpression): void {
  let rightRegister: number = -1;
  switch (node.operatorToken.kind) {
    case ts.SyntaxKind.EqualsToken: {
      // TODO: prop access assignment

      if (isElementAccessExpression(node.left)) {
        const objectInstruction = codegen.visit(node.left.expression);
        const objectRegister = codegen.getTargetRegister(objectInstruction);
        const indexInstruction = codegen.visit(node.left.argumentExpression);
        const value = codegen.getConstantValue(node.left.argumentExpression);
        const isLoad = isLOADV(indexInstruction);

        if (value !== undefined || isLoad) {
          const indexValue = isLoad ? indexInstruction.value : constantVmValue(value!);
          if (indexValue.kind === VmValueKind.Int) {
            codegen.undoLastAddition();

            const right = codegen.visit(node.right);
            rightRegister = codegen.getTargetRegister(right);
            codegen.pushInstruction(STORE_INDEXK(rightRegister, objectRegister, indexValue.value as number));
          }
        } else {
          const indexRegister = codegen.getTargetRegister(indexInstruction);
          const right = codegen.visit(node.right);
          rightRegister = codegen.getTargetRegister(right);
          codegen.pushInstruction(STORE_INDEX(rightRegister, objectRegister, indexRegister));
          codegen.freeRegister(indexRegister);
        }

        codegen.freeRegister(objectRegister);
        break;
      }

      assert(isIdentifier(node.left), "Binding patterns not yet supported");
      const right = codegen.visit(node.right);
      rightRegister = codegen.getTargetRegister(right);
      codegen.pushInstruction(STORE(rightRegister, node.left.text));
      break;
    }

    default: {
      const op = OPERATOR_OPCODE_MAP[node.operatorToken.kind];
      if (op === undefined)
        throw new Error(`Unsupported binary operator ${ts.SyntaxKind[node.operatorToken.kind]}`);

      // replace the left register value with the result
      const left = codegen.visit(node.left);
      const leftRegister = codegen.getTargetRegister(left);
      const right = codegen.visit(node.right);
      rightRegister = codegen.getTargetRegister(right);
      codegen.pushInstruction(binaryInstruction(op, leftRegister, leftRegister, rightRegister));
      break;
    }
  }

  // free the right value (we don't need it anymore)
  codegen.freeRegister(rightRegister);
}