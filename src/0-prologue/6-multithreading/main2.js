import { Worker } from 'worker_threads';
import * as path from 'path';
import { log } from 'console';

const numThreads = 4;

const array = [1, 2, 3, 4];
const chunkSize = Math.ceil(array.length / numThreads);
console.log('chunkSize', chunkSize);

function sumArraySingleScalar(array) {
  let result = 0;

  for (let i = 0; i < array.length; i++) {
    result += array[i];
  }

  return result;
}

const workerPool2 = Array.from({ length: numThreads }, (_value, i) => {
  const workerArray = array.slice(i * chunkSize, (i + 1) * chunkSize);
  console.log('workerArray', i, workerArray);
  return new Worker(path.resolve(import.meta.dirname, './worker2.js'), {
    workerData: { array: workerArray }
  });
});


/**
 * @param {number[]} array 
 */
async function sumArrayInWorkers2(array) {
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

      worker.postMessage({ start, length: chunkSize });
      // worker.postMessage({ chunkIndex: i });
    }));
  }

  const results = await Promise.all(workers);
  const totalSum = sumArraySingleScalar(results);

  for (const worker of workerPool2) {
    worker.removeAllListeners();
  }

  return totalSum;
}

function main1() {
  const worker = new Worker(path.resolve(import.meta.dirname, './worker2.js'), {
    workerData: { array: array }
  });

  worker.on('message', (result => {
    console.log('Result', result);
    worker.terminate();
  }));

  worker.on('error', error => {
    console.error('Error', error);
  });

  worker.on('exit', (code) => {
    console.error(`Worker stopped with exit code ${code}`);
    if (code !== 0) {
      // reject(new Error(`Worker stopped with exit code ${code}`));
    }
  });

  worker.postMessage({ array: array });
}

const finalResult1 = await sumArrayInWorkers2(array);
console.log('FinalResult1', finalResult1);

const finalResult2 = await sumArrayInWorkers2(array);
console.log('FinalResult2', finalResult2);

for (const worker of workerPool2) {
  worker.terminate();
}
