function makeGreeter(greeting: string) {
  function greet(name: string): void {
    console.log(greeting + ", " + name + "!");
  }

  return greet;
}

const hello = makeGreeter("Hello");
hello("Runic");
hello("Bobby boy");