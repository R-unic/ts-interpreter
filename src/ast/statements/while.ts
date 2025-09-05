import type ts from "typescript";

import { whileLoop } from "../utility";
import type { Codegen } from "@/codegen";

// TODO: DCE after infinite loop
export function visitWhileStatement(codegen: Codegen, node: ts.WhileStatement): void {
  whileLoop(codegen, node.expression, node.statement);
}