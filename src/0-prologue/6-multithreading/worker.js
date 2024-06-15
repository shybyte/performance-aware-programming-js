import { parentPort, workerData } from 'worker_threads';

function sumArraySingleScalar(array) {
  let result = 0;

  for (let i = 0; i < array.length; i++) {
    result += array[i];
  }

  return result;
}


if (parentPort && workerData) {
  const { array } = workerData;
  const sum = sumArraySingleScalar(array);
  parentPort.postMessage(sum);
}