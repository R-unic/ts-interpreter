export const enum VmValueKind {
  Float,
  Int,
  Boolean,
  Null
}

interface VmValueTypes {
  [VmValueKind.Float]: number;
  [VmValueKind.Int]: number;
  [VmValueKind.Boolean]: boolean;
  [VmValueKind.Null]: undefined;
}

export interface VmValue<T extends VmValueKind = VmValueKind> {
  readonly kind: T;
  readonly value: VmValueTypes[T];
}

export function vmValue(kind: VmValueKind, value: VmValueTypes[VmValueKind]): VmValue<VmValueKind> {
  return { kind, value };
}