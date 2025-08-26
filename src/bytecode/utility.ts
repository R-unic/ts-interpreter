import type { BinaryInstruction, Instruction } from "./structs";

export function isBinaryInstruction(instruction: Instruction): instruction is BinaryInstruction {
  return maybeGetTargetRegister(instruction) !== undefined
    && "a" in instruction
    && typeof instruction.a === "number"
    && "b" in instruction
    && typeof instruction.b === "number";
}

export function maybeGetTargetRegister(instruction: Instruction): number | undefined {
  return instruction !== undefined && "target" in instruction && typeof instruction.target === "number"
    ? instruction.target
    : undefined;
}

export function getTargetRegister(instruction: Instruction): number {
  const target = maybeGetTargetRegister(instruction);
  if (target === undefined)
    throw new Error(`Could not find target register field in instruction: ${instruction}`);

  return target;
}