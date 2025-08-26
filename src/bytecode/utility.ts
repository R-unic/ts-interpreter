import { Instruction } from "./structs";

export function getTargetRegister(instruction: Instruction): number {
  const target = instruction !== undefined && "target" in instruction && typeof instruction.target === "number"
    ? instruction.target
    : undefined;

  if (target === undefined)
    throw new Error(`Could not find target register field in instruction: ${instruction}`);

  return target;
}