const enum TokenKind {
  Plus,
  Minus,
  Star,
  Slash
}

interface Token {
  readonly kind: TokenKind;
  readonly text: string;
}

interface LexState {
  readonly sourceLength: number;
  readonly source: string;
  readonly tokens: Token[];
  position: number;
}

const ONE_CHARACTER_TOKENS: Record<string, TokenKind> = {
  ["+"]: TokenKind.Plus,
  ["-"]: TokenKind.Minus,
  ["*"]: TokenKind.Star,
  ["/"]: TokenKind.Slash,
}

function tokenize(source: string): readonly Token[] {
  const sourceLength = source.length;
  const state: LexState = { sourceLength, source, tokens: [], position: 0 };
  while (state.position < state.sourceLength)
    lex(state, currentCharacter(state));

  return state.tokens;
}

function lex(state: LexState, char: string): void {
  const kind = ONE_CHARACTER_TOKENS[char];
  advance(state);

  if (!kind) {
    console.log("Unexpected character: '" + char + "'");
    return;
  }

  state.tokens.push({
    kind,
    text: char // for now
  });
}

function advance(state: LexState, amount = 1): void {
  state.position = state.position + amount;
}

function currentCharacter(state: LexState): string {
  return state.source[state.position];
}

console.log(tokenize("+-*/"));
