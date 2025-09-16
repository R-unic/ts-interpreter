const enum Op {
  Load,
  Add
}

type VmValue = number;

interface LoadInstruction {
  readonly op: Op.Load;
  readonly dst: number;
  readonly value: VmValue;
}

interface AddInstruction {
  readonly op: Op.Add;
  readonly dst: number;
  readonly srcA: number;
  readonly srcB: number;
}

type Instruction = LoadInstruction | AddInstruction;

interface Vm {
  pc: 0;
  readonly registers: [VmValue?, VmValue?, VmValue?, VmValue?];
  readonly instructions: Instruction[];
}

const vm: Vm = {
  pc: 0,
  registers: [],
  instructions: [
    {
      op: Op.Load,
      dst: 0,
      value: 5
    }, {
      op: Op.Load,
      dst: 1,
      value: 10
    }, {
      op: Op.Add,
      dst: 0,
      srcA: 0,
      srcB: 1
    }
  ]
};

function run(): VmValue | undefined {
  for (let i = 0; i < vm.instructions.length; i++) {
    const instruction = vm.instructions[i];
    execute(instruction);
  }

  return vm.registers[0];
}

function execute(instruction: Instruction): void {
  if (instruction.op === Op.Load)
    setRegister(instruction.dst, instruction.value);
  else if (instruction.op === Op.Add) {
    const a = getRegister(instruction.srcA);
    const b = getRegister(instruction.srcB);
    if (!a || !b)
      return console.log("No A/B value found to add");

    setRegister(instruction.dst, a + b);
  }
}

function getRegister(register: number): VmValue | undefined {
  return vm.registers[register];
}

function setRegister(register: number, value: VmValue): void {
  vm.registers[register] = value;
}

function clearRegister(register: number): void {
  vm.registers[register] = undefined;
}

console.log(run());