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

const source = "+-*/";
const tokens: TokenType[] = [];
for (let i = 0; i < source.length; i = i + 1) {
  console.log(i)
  console.log(source)
  console.log(source[i])
  lex(tokens, source[i]);
}

console.log(tokens);