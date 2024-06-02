import { performance, createHistogram } from 'perf_hooks';

// lscpu | grep MHz
const CPU_MAX_GHZ = 3.6

const ARRAY_SIZE = 4096; // 0x1000
const TRY_COUNT = 100_000;

const EXPECTED_RESULT = 8386560;


function generateNumberArray(size) {
  const result = new Array(size);
  // const result = new Uint32Array(size);
  // const result = new Int32Array(size);
  // const result = new Int16Array(size);
  // const result = new Uint16Array(size);

  for (let i = 0; i < size; i++) {
    result[i] = i;
  }

  return result;
}

const array = generateNumberArray(ARRAY_SIZE);


function sumArray(array) {
  let result = 0;

  for (let i = 0; i < array.length; i++) {
    result += array[i];
  }

  return result;
}

function sumArrayForOf(array) {
  let result = 0;

  for (const el of array) {
    result += el;
  }

  return result;
}

function sumArrayForEach(array) {
  let result = 0;

  array.forEach(el => {
    result += el;
  });

  return result;
}

function sumArrayReduce(array) {
  return array.reduce((acc, el) => acc + el);
}


function measureSpeed(expectedResult, callback) {
  const histogram = createHistogram();

  for (let i = 0; i < TRY_COUNT; i++) {
    const start = performance.now();
    const result = callback();
    if(expectedResult != undefined && expectedResult != result) {
    throw new Error(`Invalid result ${result} instead of expected result ${expectedResult}`)
    }
    const duration = performance.now() - start;
    histogram.record(Math.floor(duration * 1_000_000)); //nano seconds
  }

  return histogram;
}

const benchmarkResults = [];

const functionsToTest = [sumArray, sumArrayReduce, sumArrayForOf, sumArrayForEach];

for (const functionToTest of functionsToTest) {
  const histogram = measureSpeed(EXPECTED_RESULT, () => functionToTest(array));

  const timeNanoSeconds = histogram.min;
  const cycles = timeNanoSeconds * CPU_MAX_GHZ;
  const cyclesPerAdd = cycles / ARRAY_SIZE;
  const addsPerCycle = 1 / cyclesPerAdd;

  const functionToTestName = functionToTest.name;
  console.log(`FunctionToTest: ${functionToTestName}`) ;
  console.log(`Time: ${timeNanoSeconds} nanoseconds`);
  console.log(`Cycles: ${cycles} cycles`);
  console.log(`Cycles/add: ${cyclesPerAdd}`);
  console.log(`Adds/cycle: ${addsPerCycle}`);
  console.log(``);

  benchmarkResults.push({ name: functionToTestName, timeNanoSeconds, cycles, cyclesPerAdd, addsPerCicle: addsPerCycle });

}

console.table(benchmarkResults);

