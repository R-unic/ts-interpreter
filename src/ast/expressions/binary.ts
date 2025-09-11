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
import { constantBinaryInstruction } from "@/bytecode/instructions/constant-binary";

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
const CONST_OPERATOR_OPCODE_MAP: Partial<Record<ts.BinaryOperator, InstructionOp>> = {
  [ts.SyntaxKind.PlusToken]: InstructionOp.ADDK,
  [ts.SyntaxKind.MinusToken]: InstructionOp.SUBK,
  [ts.SyntaxKind.AsteriskToken]: InstructionOp.MULK,
  [ts.SyntaxKind.SlashToken]: InstructionOp.DIVK,
  [ts.SyntaxKind.PercentToken]: InstructionOp.MODK,
  [ts.SyntaxKind.AsteriskAsteriskToken]: InstructionOp.POWK,
  [ts.SyntaxKind.CaretToken]: InstructionOp.BXORK,
  [ts.SyntaxKind.AmpersandToken]: InstructionOp.BANDK,
  [ts.SyntaxKind.BarToken]: InstructionOp.BORK,
  [ts.SyntaxKind.LessThanLessThanToken]: InstructionOp.BLSHK,
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken]: InstructionOp.BRSHK,
  [ts.SyntaxKind.GreaterThanGreaterThanToken]: InstructionOp.BARSHK
};

export function visitBinaryExpression(codegen: Codegen, node: ts.BinaryExpression): void {
  const constantValue = codegen.getConstantValue(node);
  if (constantValue !== undefined)
    return loadConstant(codegen, constantValue);

  let rightRegister: number = -1;
  switch (node.operatorToken.kind) {
    case ts.SyntaxKind.EqualsToken: {
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
      const operatorKind = node.operatorToken.kind;
      const op = OPERATOR_OPCODE_MAP[operatorKind];
      if (op === undefined)
        throw new Error(`Unsupported binary operator ${ts.SyntaxKind[operatorKind]}`);

      const constOp = CONST_OPERATOR_OPCODE_MAP[operatorKind];
      // replace the left register's value with the result
      const left = codegen.visit(node.left);
      const leftConstant = codegen.getConstantValue(node.left);
      const isLeftLoad = isLOADV(left);
      if (constOp !== undefined && (leftConstant !== undefined || isLeftLoad)) {
        const value = isLeftLoad ? left.value : constantVmValue(leftConstant!);
        const register = codegen.getTargetRegister(left);
        codegen.freeRegister(register);
        codegen.undoLastAddition();

        const right = codegen.visit(node.right);
        rightRegister = codegen.getTargetRegister(right);
        codegen.pushInstruction(constantBinaryInstruction(constOp, rightRegister, value, rightRegister));
        break;
      }

      const right = codegen.visit(node.right);
      const rightConstant = codegen.getConstantValue(node.right);
      const isRightLoad = isLOADV(right);
      if (constOp === InstructionOp.ADDK && (rightConstant !== undefined || isRightLoad)) {
        const value = isRightLoad ? right.value : constantVmValue(rightConstant!);
        const register = codegen.getTargetRegister(right);
        codegen.freeRegister(register);
        codegen.undoLastAddition();
        codegen.pushInstruction(constantBinaryInstruction(constOp, register, value, register));
        break;
      }

      const leftRegister = codegen.getTargetRegister(left);
      rightRegister = codegen.getTargetRegister(right);
      codegen.pushInstruction(binaryInstruction(op, leftRegister, leftRegister, rightRegister));
      break;
    }
  }

  // free the right value (we don't need it anymore)
  codegen.freeRegister(rightRegister);
}