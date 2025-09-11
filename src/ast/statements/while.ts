import type ts from "typescript";

import { emitWhileLoop } from "../utility";
import type { Codegen } from "@/codegen";

// TODO: DCE after infinite loop
export function visitWhileStatement(codegen: Codegen, node: ts.WhileStatement): void {
  emitWhileLoop(codegen, node.expression, node.statement);
}