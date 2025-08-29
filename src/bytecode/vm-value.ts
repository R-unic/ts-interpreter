import { inspect } from "util";

export enum VmValueKind {
  Float,
  Int,
  String,
  Boolean,
  Null
}

interface VmValueTypes {
  [VmValueKind.Float]: number;
  [VmValueKind.Int]: number;
  [VmValueKind.String]: string;
  [VmValueKind.Boolean]: boolean;
  [VmValueKind.Null]: undefined;
}

export interface VmValue<T extends VmValueKind = VmValueKind> {
  readonly kind: T;
  readonly value: VmValueTypes[T];
  get [Symbol.toStringTag](): string;
  [inspect.custom](): string;
}

export function vmValue<T extends VmValueKind>(kind: T, value: VmValueTypes[T]): VmValue<T> {
  return {
    kind, value,

    get [Symbol.toStringTag](): string {
      return VmValueKind[kind] + "(" + inspect(value === undefined ? null : value, { compact: true, colors: true, customInspect: true }) + ")";
    },
    [inspect.custom](): string {
      return this.toString();
    }
  };
}