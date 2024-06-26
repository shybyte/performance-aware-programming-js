// @ts-ignore
// import { sumArraySingleScalar as sumArraySingleScalarZig } from '../zig/sum_array.zig';
// @ts-ignore
import { sumArraySingleScalar as sumArraySingleScalarZig } from '../lib/sum_array.zigar';

import { performance, createHistogram } from 'perf_hooks';

// lscpu | grep MHz
const CPU_MAX_GHZ = 3.6
const numThreads = 4;

const ARRAY_SIZE_MIN = 4096; // 0x1000
const ARRAY_SIZE_L2 = 262_144;
const ARRAY_SIZE_L3 = 1_572_864;
const ARRAY_SIZE_MAIN_MEM = 10 * ARRAY_SIZE_L3;
const ARRAY_SIZE = ARRAY_SIZE_L2; 

const TRY_COUNT = 1000;


function generateNumberArray(size) {
  // const result = new Array(size);
  const result = new Uint32Array(size);
  // const result = new Int32Array(size);
  // const result = new Int16Array(size);
  // const result = new Uint16Array(size);

  for (let i = 0; i < size; i++) {
    result[i] = i;
  }

  return result;
}

const array = generateNumberArray(ARRAY_SIZE);


function sumArraySingleScalarJs(array) {
  let result = 0;

  for (let i = 0; i < array.length; i++) {
    result += array[i];
  }

  return result;
}


async function measureSpeed(expectedResult, callback) {
  const histogram = createHistogram();

  for (let i = 0; i < TRY_COUNT; i++) {
    const start = performance.now();
    const result = await callback();
    if (expectedResult != undefined && expectedResult != result) {
      throw new Error(`Invalid result ${result} instead of expected result ${expectedResult}`)
    }
    const duration = performance.now() - start;
    histogram.record(Math.floor(duration * 1_000_000)); //nano seconds
  }

  return histogram;
}

const benchmarkResults = [];

const functionsToTest = [sumArraySingleScalarJs, sumArraySingleScalarZig];

for (const functionToTest of functionsToTest) {
  const expectedResult = sumArraySingleScalarJs(array);
  const histogram = await measureSpeed(expectedResult, () => functionToTest(array));

  const timeNanoSeconds = histogram.min;
  const cycles = timeNanoSeconds * CPU_MAX_GHZ;
  const cyclesPerAdd = cycles / ARRAY_SIZE;
  const addsPerCycle = 1 / cyclesPerAdd;

  const functionToTestName = functionToTest.name;
  console.log(`FunctionToTest: ${functionToTestName}`);
  console.log(`Time: ${timeNanoSeconds} nanoseconds`);
  console.log(`Cycles: ${cycles} cycles`);
  console.log(`Cycles/add: ${cyclesPerAdd}`);
  console.log(`Adds/cycle: ${addsPerCycle}`);
  console.log(``);

  benchmarkResults.push({ name: functionToTestName, timeNanoSeconds, cycles, cyclesPerAdd, addsPerCicle: addsPerCycle });

}

console.table(benchmarkResults);

