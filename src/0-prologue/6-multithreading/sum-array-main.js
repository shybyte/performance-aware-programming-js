import { Worker } from 'worker_threads';
import * as path from 'path';


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
const chunkSize = Math.ceil(array.length / numThreads);



function sumArraySingleScalar(array) {
  let result = 0;

  for (let i = 0; i < array.length; i++) {
    result += array[i];
  }

  return result;
}

function sumArraySingleScalar2Internal(array, start, end) {
  let result = 0;

  for (let i = start; i < end; i++) {
    result += array[i];
  }

  return result;
}

function sumArraySingleScalar2(array) {
  return sumArraySingleScalar2Internal(array, 0, array.length);
}


/**
 * @param {number[]} array 
 */
function sumArrayInWorkers(array) {
  const chunkSize = Math.ceil(array.length / numThreads);


  const workers = []; /** @type {Promise<number>[]} */

  for (let i = 0; i < numThreads; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const chunk = array.slice(start, end);

    workers.push(new Promise((resolve, reject) => {
      const worker = new Worker(path.resolve(import.meta.dirname, './worker.js'), {
        workerData: { array: chunk }
      });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    }));
  }

  return Promise.all(workers)
    .then((results) => {
      const totalSum = results.reduce((acc, val) => acc + val, 0);
      // console.log(`Total sum: ${totalSum}`);
      return totalSum
    });
}

// const workerPool2 = Array.from({length: numThreads}, () => new Worker(path.resolve(import.meta.dirname, './worker2.js'), {
//   workerData: { array: array }
// }));

const workerPool2 = Array.from({ length: numThreads }, (_value, i) => {
  const workerArray = array.slice(i * chunkSize, (i + 1) * chunkSize);
  // console.log('workerArray', i, workerArray);
  return new Worker(path.resolve(import.meta.dirname, './worker2.js'), {
    workerData: { array: workerArray }
  });
});

/**
 * @param {number[]} array 
 */
async function sumArrayInWorkers2(array) {
  const numThreads = 4;

  const chunkSize = Math.ceil(array.length / numThreads);


  const workers = []; /** @type {Promise<number>[]} */

  for (let i = 0; i < numThreads; i++) {
    const worker = workerPool2[i];
    worker.removeAllListeners();
    
    const start = i * chunkSize;
    // const end = start + chunkSize;
    // const chunk = array.slice(start, end);

    workers.push(new Promise((resolve, reject) => {
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });

      worker.postMessage({start, length: chunkSize });
      // worker.postMessage({array: chunk});
    }));
  }

  const results = await Promise.all(workers);
  const totalSum = sumArraySingleScalar(results);
  // const totalSum = results[0];
  
  for (const worker of workerPool2) {
    worker.removeAllListeners();
  }

  return totalSum;
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

const functionsToTest = [sumArraySingleScalar, sumArrayInWorkers2];

for (const functionToTest of functionsToTest) {
  const expectedResult = sumArraySingleScalar(array);
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

for (const worker of workerPool2) {
  worker.terminate();
}

