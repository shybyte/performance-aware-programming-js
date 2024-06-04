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


function sumArraySingleScalar(array) {
  let result = 0;

  for (let i = 0; i < array.length; i++) {
    result += array[i];
  }

  return result;
}

function sumArrayUnroll2Scalar(array) {
  let result = 0;

  for (let i = 0; i < array.length; i += 2) {
    result += array[i];
    result += array[i + 1];
  }

  return result;
}

function sumArrayDualScalar(array) {
  let sum0 = 0;
  let sum1 = 0;

  for (let i = 0; i < array.length; i += 2) {
    sum0 += array[i];
    sum1 += array[i + 1];
  }

  return sum0 + sum1;
}

function sumArrayQuadScalar(array) {
  let sum0 = 0;
  let sum1 = 0;
  let sum2 = 0;
  let sum3 = 0;

  for (let i = 0; i < array.length; i += 4) {
    sum0 += array[i];
    sum1 += array[i + 1];
    sum2 += array[i + 2];
    sum3 += array[i + 3];
  }

  return sum0 + sum1 + sum2 + sum3;
}

function sumArray8Scalar(array) {
  let sum0 = 0;
  let sum1 = 0;
  let sum2 = 0;
  let sum3 = 0;
  let sum4 = 0;
  let sum5 = 0;
  let sum6 = 0;
  let sum7 = 0;

  for (let i = 0; i < array.length; i += 8) {
    sum0 += array[i];
    sum1 += array[i + 1];
    sum2 += array[i + 2];
    sum3 += array[i + 3];
    sum4 += array[i + 4];
    sum5 += array[i + 5];
    sum6 += array[i + 6];
    sum7 += array[i + 7];
  }

  return sum0 + sum1 + sum2 + sum3 + sum4 + sum5 + sum6 + sum7;
}


function measureSpeed(expectedResult, callback) {
  const histogram = createHistogram();

  for (let i = 0; i < TRY_COUNT; i++) {
    const start = performance.now();
    const result = callback();
    if (expectedResult != undefined && expectedResult != result) {
      throw new Error(`Invalid result ${result} instead of expected result ${expectedResult}`)
    }
    const duration = performance.now() - start;
    histogram.record(Math.floor(duration * 1_000_000)); //nano seconds
  }

  return histogram;
}

const benchmarkResults = [];

const functionsToTest = [sumArraySingleScalar, sumArrayUnroll2Scalar, sumArrayDualScalar, sumArrayQuadScalar, sumArray8Scalar];

for (const functionToTest of functionsToTest) {
  const histogram = measureSpeed(EXPECTED_RESULT, () => functionToTest(array));

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

