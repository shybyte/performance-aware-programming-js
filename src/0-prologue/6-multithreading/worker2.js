import { log } from 'console';
import { parentPort, workerData } from 'worker_threads';

function sumArraySingleScalarRange(array, start, end) {
  let result = 0;

  for (let i = start; i < end; i++) {
    result += array[i];
  }

  return result;
}

function sumArraySingleScalar(array) {
  let result = 0;

  for (let i = 0; i < array.length; i++) {
    result += array[i];
  }

  return result;
}

parentPort.on('message', (message) => {
  // console.log('Got message', message);
  // console.log(workerData);
  // parentPort.postMessage(sumArraySingleScalarRange(workerData.array, message.start, message.start + message.length));;
  parentPort.postMessage(sumArraySingleScalar(workerData.array));
})

// if (parentPort && workerData) {
//   const { array } = workerData;
//   const sum = sumArraySingleScalar(array);
//   parentPort.postMessage(sum);
// }