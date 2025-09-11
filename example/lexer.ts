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
  readonly tokens: Token[];
}

function lex(state: LexState, char: string): void {
  let kind: TokenKind | undefined;
  if (char === '+')
    kind = TokenKind.Plus;
  else if (char === '-')
    kind = TokenKind.Minus;
  else if (char === '*')
    kind = TokenKind.Star;
  else if (char === '/')
    kind = TokenKind.Slash;

  if (!kind) {
    console.log("Unexpected character: '" + char + "'");
    return;
  }

  state.tokens.push({
    kind,
    text: char // for now
  });
}

function tokenize(source: string): readonly Token[] {
  const state: LexState = { tokens: [] };
  for (let i = 0; i < source.length; i++)
    lex(state, source[i]);

  return state.tokens;
}

console.log(tokenize("+-*/"));
