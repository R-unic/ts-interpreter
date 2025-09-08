import ts from "typescript";

import { emitIncrementor } from "../utility";
import type { Codegen } from "@/codegen";

export function visitPostfixUnaryExpression(codegen: Codegen, node: ts.PostfixUnaryExpression): void {
  emitIncrementor(codegen, node, true);
}