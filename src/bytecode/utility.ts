import type ts from "typescript";
import { inspect, type InspectOptions } from "util";

import { constantVmValue, Null } from "./vm-value";
import { isLOADV, LOADV } from "./instructions/loadv";
import { InstructionOp, type Bytecode, type Instruction } from "./structs";
import type { InstructionSTORE } from "./instructions/store";
import type { InstructionSTOREK } from "./instructions/storek";
import type { Codegen } from "@/codegen";

export function createStore(codegen: Codegen, name: string, initializer?: ts.Expression): InstructionSTORE | InstructionSTOREK {
  if (!initializer)
    return instruction(InstructionOp.STOREK, { name, value: Null });

  const initializerInstruction = codegen.visit(initializer);
  const constantValue = codegen.getConstantValue(initializer);
  const isLoad = isLOADV(initializerInstruction);
  if (constantValue !== undefined || isLoad) {
    const value = isLoad ? initializerInstruction.value : constantVmValue(constantValue!);
    codegen.undoLastAddition();

    return instruction(InstructionOp.STOREK, { name, value });
  }

  const source = codegen.getTargetRegister(initializerInstruction);
  codegen.freeRegister(source); // TODO: more guidelines for freeing

  return instruction(InstructionOp.STORE, { source, name });
}

export function loadConstant(codegen: Codegen, constantValue: string | number | boolean): void {
  const register = codegen.allocRegister();
  codegen.pushInstruction(LOADV(register, constantVmValue(constantValue)));
}

export function loadNull(register: number): Instruction {
  return LOADV(register, Null);
}

export const INSPECT_OPTIONS: InspectOptions = {
  compact: true,
  colors: true,
  customInspect: true,
  showHidden: false,
  depth: null
};

export function instruction<T extends {}, Op extends InstructionOp>(op: Op, data: T): Instruction & T & { readonly op: Op; } {
  return {
    op, ...data,

    get [Symbol.toStringTag](): string {
      const copy: typeof this = {} as never;
      for (const key of Object.keys(this) as (keyof typeof this)[]) {
        if (key === "op") continue;
        copy[key] = this[key];
      }

      const dataString = inspect(copy, INSPECT_OPTIONS);
      return InstructionOp[op] + (dataString === "{}" ? "" : " " + dataString);
    },
    [inspect.custom](): string {
      return this.toString();
    }
  };
}

export function bytecodeToString(bytecode: Bytecode): string {
  const output: string[] = ["["];
  let indent = 0;

  const expanded = bytecode.length > 1;
  if (expanded) {
    output.push("\n");
    indent++;
  }

  let i = 0;
  for (const instruction of bytecode) {
    output.push((i++).toString());
    output.push(": ");
    output.push("\t".repeat(indent));
    output.push(instruction.toString());
    if (!expanded) continue;

    output.push("\n");
  }

  if (expanded) {
    output.push("\n");
    indent--;
  }

  output.push("]");
  return output.join("");
}

export function maybeGetTargetRegister(instruction: Instruction): number | undefined {
  return instruction !== undefined && "target" in instruction && typeof instruction.target === "number"
    ? instruction.target
    : undefined;
}

export function maybeGetSourceRegister(instruction: Instruction): number | undefined {
  return instruction !== undefined && "source" in instruction && typeof instruction.source === "number"
    ? instruction.source
    : undefined;
}

export function getTargetRegister(instruction: Instruction): number {
  const target = maybeGetTargetRegister(instruction);
  if (target === undefined)
    throw new Error(`Could not find target register field in instruction: ${instruction}`);

  return target;
}

export function getSourceRegister(instruction: Instruction): number {
  const target = maybeGetSourceRegister(instruction);
  if (target === undefined)
    throw new Error(`Could not find source register field in instruction: ${instruction}`);

  return target;
}

export function getTargetOrSourceRegister(instruction: Instruction): number {
  const target = maybeGetTargetRegister(instruction);
  if (target !== undefined)
    return target;

  const source = maybeGetSourceRegister(instruction);
  if (source !== undefined)
    return source;

  throw new Error(`Could not find target or source register field in instruction: ${instruction}`);
}