const enum TokenType {
  Plus,
  Minus,
  Star,
  Slash
}

function lex(tokens: TokenType[], char: string): void {
  let kind: TokenType | undefined;
  if (char === '+')
    kind = TokenType.Plus;
  else if (char === '-')
    kind = TokenType.Minus;
  else if (char === '*')
    kind = TokenType.Star;
  else if (char === '/')
    kind = TokenType.Slash;

  if (!kind) {
    console.log("Unexpected character: '" + char + "'");
    return;
  }

  tokens.push(kind);
}

function tokenize(source: string): readonly TokenType[] {
  const tokens: TokenType[] = [];
  for (let i = 0; i < source.length; i = i + 1)
    lex(tokens, source[i]);

  return tokens;
}

console.log(tokenize("+-*/"));