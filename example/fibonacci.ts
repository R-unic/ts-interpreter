// for recursive fibonacci to work we need call stack scopes
function fibonacci(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 1;

  let a = 0, b = 1, i = 2;
  while (i <= n) {
    const temp = a + b;
    a = b;
    b = temp;
    i = i + 1;
  }

  return b;
}

const result = fibonacci(25);
console.log(result); // 75025