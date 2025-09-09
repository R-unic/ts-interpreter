import ts, { isElementAccessExpression, isIdentifier, isPrivateIdentifier, isPropertyAccessExpression } from "typescript";
import assert from "assert";

import { createStore, loadConstant } from "@/bytecode/utility";
import { constantVmValue, VmValueKind } from "@/bytecode/vm-value";
import { InstructionOp } from "@/bytecode/structs";
import { binaryInstruction } from "@/bytecode/instructions/binary";
import { isLOADV, LOADV } from "@/bytecode/instructions/loadv";
import { STORE_INDEXN } from "@/bytecode/instructions/store-indexn";
import { STORE_INDEXK } from "@/bytecode/instructions/store-indexk";
import { STORE_INDEX } from "@/bytecode/instructions/store-index";
import type { Codegen } from "@/codegen";

const OPERATOR_OPCODE_MAP: Partial<Record<ts.BinaryOperator, InstructionOp>> = {
  [ts.SyntaxKind.PlusToken]: InstructionOp.ADD,
  [ts.SyntaxKind.MinusToken]: InstructionOp.SUB,
  [ts.SyntaxKind.AsteriskToken]: InstructionOp.MUL,
  [ts.SyntaxKind.SlashToken]: InstructionOp.DIV,
  [ts.SyntaxKind.PercentToken]: InstructionOp.MOD,
  [ts.SyntaxKind.AsteriskAsteriskToken]: InstructionOp.POW,
  [ts.SyntaxKind.CaretToken]: InstructionOp.BXOR,
  [ts.SyntaxKind.AmpersandToken]: InstructionOp.BAND,
  [ts.SyntaxKind.BarToken]: InstructionOp.BOR,
  [ts.SyntaxKind.LessThanLessThanToken]: InstructionOp.BLSH,
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken]: InstructionOp.BRSH,
  [ts.SyntaxKind.GreaterThanGreaterThanToken]: InstructionOp.BARSH,
  [ts.SyntaxKind.LessThanToken]: InstructionOp.LT,
  [ts.SyntaxKind.LessThanEqualsToken]: InstructionOp.LTE,
  [ts.SyntaxKind.GreaterThanToken]: InstructionOp.GT,
  [ts.SyntaxKind.GreaterThanEqualsToken]: InstructionOp.GTE,
  [ts.SyntaxKind.EqualsEqualsEqualsToken]: InstructionOp.EQ,
  [ts.SyntaxKind.ExclamationEqualsEqualsToken]: InstructionOp.NEQ,
};

export function visitBinaryExpression(codegen: Codegen, node: ts.BinaryExpression): void {
  const constantValue = codegen.getConstantValue(node);
  if (constantValue !== undefined)
    return loadConstant(codegen, constantValue);

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
          codegen.undoLastAddition();

          const right = codegen.visit(node.right);
          rightRegister = codegen.getTargetRegister(right);
          if (indexValue.kind === VmValueKind.Int)
            codegen.pushInstruction(STORE_INDEXN(rightRegister, objectRegister, indexValue.value as number));
          else
            codegen.pushInstruction(STORE_INDEXK(rightRegister, objectRegister, indexValue));
        } else {
          const indexRegister = codegen.getTargetRegister(indexInstruction);
          const right = codegen.visit(node.right);
          rightRegister = codegen.getTargetRegister(right);
          codegen.pushInstruction(STORE_INDEX(rightRegister, objectRegister, indexRegister));
          codegen.freeRegister(indexRegister);
        }

        codegen.freeRegister(objectRegister);
        break;
      } else if (isPropertyAccessExpression(node.left)) {
        const objectInstruction = codegen.visit(node.left.expression);
        const objectRegister = codegen.getTargetRegister(objectInstruction);
        assert(isIdentifier(node.left.name) || isPrivateIdentifier(node.left.name), "Binding patterns not yet supported");

        const right = codegen.visit(node.right);
        rightRegister = codegen.getTargetRegister(right);
        codegen.pushInstruction(STORE_INDEXK(rightRegister, objectRegister, constantVmValue(node.left.name.text)));
        codegen.freeRegister(objectRegister);
        break;
      }

      assert(isIdentifier(node.left) || isPrivateIdentifier(node.left), "Binding patterns not yet supported");
      codegen.pushInstruction(createStore(codegen, node.left.text, node.right));
      break;
    }

    default: {
      const op = OPERATOR_OPCODE_MAP[node.operatorToken.kind];
      if (op === undefined)
        throw new Error(`Unsupported binary operator ${ts.SyntaxKind[node.operatorToken.kind]}`);

      // replace the left register's value with the result
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