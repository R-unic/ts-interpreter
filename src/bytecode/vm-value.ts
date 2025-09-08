import { inspect } from "util";
import { INSPECT_OPTIONS } from "./utility";

export enum VmValueKind {
  Float,
  Int,
  String,
  Boolean,
  DynamicArray,
  Null
}

interface VmValueTypes {
  [VmValueKind.Float]: number;
  [VmValueKind.Int]: number;
  [VmValueKind.String]: string;
  [VmValueKind.Boolean]: boolean;
  [VmValueKind.DynamicArray]: unknown[];
  [VmValueKind.Null]: undefined;
}

export interface VmValue<T extends VmValueKind = VmValueKind> {
  readonly kind: T;
  readonly value: VmValueTypes[T];
  get [Symbol.toStringTag](): string;
  [inspect.custom](): string;
}

export const Null = vmValue(VmValueKind.Null, undefined);

export function vmValue<T extends VmValueKind>(kind: T, value: VmValueTypes[T]): VmValue<T> {
  return {
    kind, value,

    get [Symbol.toStringTag](): string {
      if (kind === VmValueKind.Null)
        return "Null";

      return VmValueKind[kind] + "(" + inspect(value === undefined ? null : value, INSPECT_OPTIONS) + ")";
    },
    [inspect.custom](): string {
      return this.toString();
    }
  };
}

export function constantVmValue<T extends string | number | boolean>(constant: T): VmValue {
  return vmValue(getValueKind(constant), constant);
}

function getValueKind<T extends string | number | boolean>(constant: T): VmValueKind {
  switch (typeof constant) {
    case "string":
      return VmValueKind.String;
    case "number":
      return getNumberKind(constant as number);
    case "boolean":
      return VmValueKind.Boolean;
  }
}

function getNumberKind(n: number): VmValueKind {
  return n % 1 === 0 ? VmValueKind.Int : VmValueKind.Float;
}